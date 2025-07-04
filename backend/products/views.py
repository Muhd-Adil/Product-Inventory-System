import json
import logging
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db import transaction
from django.db.models import F
from django_filters.rest_framework import DjangoFilterBackend

from .models import Products, Variant, SubVariant, ProductSKU
from .serializers import ProductSerializer
from stock.models import StockTransaction
from stock.serializers import StockTransactionSerializer

logger = logging.getLogger(__name__)

# Create Product API


class ProductCreateAPIView(generics.CreateAPIView):
    queryset = Products.objects.all()
    serializer_class = ProductSerializer

    def create(self, request, *args, **kwargs):
        serializer_data = {
            'ProductName': request.data.get('ProductName'),
            'ProductCode': request.data.get('ProductCode'),
            'HSNCode': request.data.get('HSNCode'),
            'IsFavourite': request.data.get('IsFavourite', False),
            'Active': request.data.get('Active', True),
        }

        if 'ProductImage' in request.data:
            serializer_data['ProductImage'] = request.data['ProductImage']

        variants_data = []
        if 'variants_json' in request.data:
            try:
                variants_data = json.loads(request.data['variants_json'])
                logger.info(
                    f"Successfully parsed variants_json: {variants_data}")
            except json.JSONDecodeError:
                logger.error("Invalid JSON format for 'variants_json'.")
                return Response({"error": "Invalid JSON format for variants_json."}, status=status.HTTP_400_BAD_REQUEST)
        elif 'variants' in request.data and isinstance(request.data['variants'], list):
            variants_data = request.data['variants']
            logger.info(
                f"Received 'variants' directly as a list: {variants_data}")
        serializer_data['variants'] = variants_data

        initial_product_skus_data = []
        if 'initial_product_skus_json' in request.data:
            try:
                initial_product_skus_data = json.loads(
                    request.data['initial_product_skus_json'])
                logger.info(
                    f"Successfully parsed initial_product_skus_json: {initial_product_skus_data}")
            except json.JSONDecodeError:
                logger.error(
                    "Invalid JSON format for 'initial_product_skus_json'.")
                return Response({"error": "Invalid JSON format for initial_product_skus_json."}, status=status.HTTP_400_BAD_REQUEST)
        elif 'initial_product_skus' in request.data and isinstance(request.data['initial_product_skus'], list):
            initial_product_skus_data = request.data['initial_product_skus']
            logger.info(
                f"Received 'initial_product_skus' directly as a list: {initial_product_skus_data}")

        logger.info(
            f"Data prepared for serializer (excluding initial_product_skus for direct field): {serializer_data}")

        serializer = self.get_serializer(
            data=serializer_data,
            context={'initial_product_skus_data': initial_product_skus_data}
        )

        serializer.is_valid(raise_exception=True)

        logger.info(f"Serializer validated data: {serializer.validated_data}")

        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def perform_create(self, serializer):
        try:
            serializer.save()
            logger.info(
                f"Product '{serializer.instance.ProductName}' (ID: {serializer.instance.id}) created successfully.")
        except Exception as e:
            logger.error(f"Error creating product: {e}", exc_info=True)
            raise

# List Product API


class ProductListAPIView(generics.ListAPIView):
    queryset = Products.objects.prefetch_related(
        'productsku_set__sub_variants').all()
    serializer_class = ProductSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = {
        'ProductName': ['icontains'],
        'ProductCode': ['exact'],
        'Active': ['exact'],
    }

# Add Stock (Purchase) API


class AddStockAPIView(APIView):
    def post(self, request, *args, **kwargs):
        product_id = request.data.get('product_id')
        product_sku_id = request.data.get('product_sku_id')
        quantity = request.data.get('quantity')

        if not all([product_id, product_sku_id, quantity is not None]):
            return Response({"error": "product_id, product_sku_id, and quantity are required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            quantity = float(quantity)
            if quantity <= 0:
                return Response({"error": "Quantity must be positive."}, status=status.HTTP_400_BAD_REQUEST)
        except ValueError:
            return Response({"error": "Quantity must be a valid number."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            with transaction.atomic():
                product_sku = ProductSKU.objects.select_for_update().get(
                    id=product_sku_id, product__id=product_id)
                product = product_sku.product

                product_sku.stock = F('stock') + quantity
                product_sku.save()
                product_sku.refresh_from_db()

                StockTransaction.objects.create(
                    product=product,
                    product_sku=product_sku,
                    transaction_type='IN',
                    quantity=quantity,
                    current_stock=product_sku.stock
                )
                logger.info(
                    f"Added {quantity} stock to ProductSKU '{product_sku.sku_code}' (ID: {product_sku.id}) for Product '{product.ProductName}'.")

                return Response({
                    "message": "Stock added successfully",
                    "product_sku_current_stock": product_sku.stock,
                }, status=status.HTTP_200_OK)
        except ProductSKU.DoesNotExist:
            logger.warning(
                f"ProductSKU with ID {product_sku_id} or Product with ID {product_id} not found for stock addition.")
            return Response({"error": "Product SKU not found."}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Error adding stock: {e}", exc_info=True)
            return Response({"error": "Internal server error.", "details": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# Remove Stock (Sale) API


class RemoveStockAPIView(APIView):
    def post(self, request, *args, **kwargs):
        product_id = request.data.get('product_id')
        product_sku_id = request.data.get('product_sku_id')
        quantity = request.data.get('quantity')

        if not all([product_id, product_sku_id, quantity is not None]):
            return Response({"error": "product_id, product_sku_id, and quantity are required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            quantity = float(quantity)
            if quantity <= 0:
                return Response({"error": "Quantity must be positive."}, status=status.HTTP_400_BAD_REQUEST)
        except ValueError:
            return Response({"error": "Quantity must be a valid number."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            with transaction.atomic():
                product_sku = ProductSKU.objects.select_for_update().get(
                    id=product_sku_id, product__id=product_id)
                product = product_sku.product

                if product_sku.stock < quantity:
                    logger.warning(
                        f"Attempted to remove {quantity} from ProductSKU '{product_sku.sku_code}' (ID: {product_sku.id}) but only {product_sku.stock} available.")
                    return Response({"error": "Not enough stock available."}, status=status.HTTP_400_BAD_REQUEST)

                product_sku.stock = F('stock') - quantity
                product_sku.save()
                product_sku.refresh_from_db()

                StockTransaction.objects.create(
                    product=product,
                    product_sku=product_sku,
                    transaction_type='OUT',
                    quantity=quantity,
                    current_stock=product_sku.stock
                )
                logger.info(
                    f"Removed {quantity} stock from ProductSKU '{product_sku.sku_code}' (ID: {product_sku.id}) for Product '{product.ProductName}'.")

                return Response({
                    "message": "Stock removed successfully",
                    "product_sku_current_stock": product_sku.stock,
                }, status=status.HTTP_200_OK)
        except ProductSKU.DoesNotExist:
            logger.warning(
                f"ProductSKU with ID {product_sku_id} or Product with ID {product_id} not found for stock removal.")
            return Response({"error": "Product SKU not found."}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Error removing stock: {e}", exc_info=True)
            return Response({"error": "Internal server error.", "details": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# Stock Report API (List transactions with date filter)
class StockReportAPIView(generics.ListAPIView):
    queryset = StockTransaction.objects.all().select_related('product', 'product_sku')
    serializer_class = StockTransactionSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = {
        'transaction_date': ['gte', 'lte'],
        'product_sku__id': ['exact'],
        'product__id': ['exact'],
        'transaction_type': ['exact'],
    }

    def get_queryset(self):
        queryset = super().get_queryset()
        return queryset
