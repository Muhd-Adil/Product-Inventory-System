# backend/products/serializers.py

from rest_framework import serializers
from django.db import transaction
from .models import Products, Variant, SubVariant, ProductSKU  # REMOVED Category
from stock.models import StockTransaction
import logging

logger = logging.getLogger(__name__)

# Serializer for SubVariant (Options like 'Red', 'S')


class SubVariantSerializer(serializers.ModelSerializer):
    class Meta:
        model = SubVariant
        fields = ['id', 'option']
        read_only_fields = ['id']


# Serializer for Variant (Types like 'Color', 'Size')
class VariantSerializer(serializers.ModelSerializer):
    sub_variants = SubVariantSerializer(many=True, required=False)

    class Meta:
        model = Variant
        fields = ['id', 'name', 'sub_variants']
        read_only_fields = ['id']

    @transaction.atomic
    def create(self, validated_data):
        sub_variants_data = validated_data.pop('sub_variants', [])
        variant = Variant.objects.create(**validated_data)
        for sv_data in sub_variants_data:
            SubVariant.objects.create(variant=variant, **sv_data)
        return variant

    @transaction.atomic
    def update(self, instance, validated_data):
        sub_variants_data = validated_data.pop('sub_variants', [])
        instance.name = validated_data.get('name', instance.name)
        instance.save()
        existing_sub_variant_ids = [str(sv.id)
                                    for sv in instance.sub_variants.all()]
        sub_variants_to_keep = []
        for sv_data in sub_variants_data:
            sv_id = sv_data.get('id')
            if sv_id and str(sv_id) in existing_sub_variant_ids:
                sub_variant = SubVariant.objects.get(
                    id=sv_id, variant=instance)
                sub_variant.option = sv_data.get('option', sub_variant.option)
                sub_variant.save()
                sub_variants_to_keep.append(sv_id)
            else:
                SubVariant.objects.create(
                    variant=instance, option=sv_data['option'])
        SubVariant.objects.filter(variant=instance).exclude(
            id__in=sub_variants_to_keep).delete()
        return instance


# Serializer for ProductSKU (primarily for reading/output now)
class ProductSKUSerializer(serializers.ModelSerializer):
    product_sku_options = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = ProductSKU
        fields = ['id', 'sku_code', 'stock', 'product_sku_options']
        read_only_fields = ['id', 'sku_code', 'stock', 'product_sku_options']

    def get_product_sku_options(self, obj):
        return ', '.join([sv.option for sv in obj.sub_variants.all().order_by('variant__name', 'option')])


# REMOVED: CategorySerializer


# Main Product Serializer
class ProductSerializer(serializers.ModelSerializer):
    variants = VariantSerializer(many=True, required=False)
    product_skus = ProductSKUSerializer(
        many=True, read_only=True, source='productsku_set')

    TotalStock = serializers.DecimalField(
        max_digits=10, decimal_places=2, read_only=True)
    ProductImage = serializers.ImageField(required=False, allow_null=True)

    # REMOVED: category = CategorySerializer(read_only=True)

    class Meta:
        model = Products
        fields = ['id', 'ProductID', 'ProductCode', 'ProductName', 'ProductImage',
                  'CreatedDate', 'UpdatedDate', 'CreatedUser', 'IsFavourite', 'Active',
                  # REMOVED 'category' from fields
                  'HSNCode', 'TotalStock', 'variants', 'product_skus']
        read_only_fields = ['id', 'CreatedDate', 'UpdatedDate',
                            'CreatedUser', 'TotalStock', 'ProductID']

    @transaction.atomic
    def create(self, validated_data):
        variants_data = validated_data.pop('variants', [])
        initial_product_skus_data = self.context.get(
            'initial_product_skus_data', [])

        logger.info(
            f"ProductSerializer.create - Received variants_data: {variants_data}")
        logger.info(
            f"ProductSerializer.create - Received product_skus_data (from context): {initial_product_skus_data}")

        if not validated_data.get('ProductID'):
            last_product = Products.objects.order_by('-ProductID').first()
            validated_data['ProductID'] = (
                last_product.ProductID if last_product and last_product.ProductID is not None else 0) + 1

        product = Products.objects.create(**validated_data)
        logger.info(
            f"Product '{product.ProductName}' created. Now creating variants and SKUs.")

        # Create Variants and SubVariants
        for variant_data in variants_data:
            sub_variants_data = variant_data.pop('sub_variants', [])
            variant = Variant.objects.create(product=product, **variant_data)
            for sv_data in sub_variants_data:
                SubVariant.objects.create(variant=variant, **sv_data)
        logger.info(
            f"Variants and SubVariants created for product '{product.ProductName}'.")

        # Create ProductSKUs manually
        if not initial_product_skus_data:
            logger.warning(
                f"No initial_product_skus_data received for product '{product.ProductName}'. SKUs will not be created.")

        for sku_data in initial_product_skus_data:
            try:
                sku_stock = sku_data.get('stock', 0)
                option_strings = sku_data.get('options', [])

                product_sku = ProductSKU.objects.create(
                    product=product, stock=sku_stock)

                sub_variants_for_sku = []
                for option_str in option_strings:
                    try:
                        sub_variant = SubVariant.objects.get(
                            option__iexact=option_str,
                            variant__product=product
                        )
                        sub_variants_for_sku.append(sub_variant)
                    except SubVariant.DoesNotExist:
                        logger.error(
                            f"SubVariant with option '{option_str}' not found for product '{product.ProductName}' during SKU creation.")
                        raise serializers.ValidationError(
                            f"SubVariant with option '{option_str}' not found for product '{product.ProductName}'."
                        )

                product_sku.sub_variants.set(sub_variants_for_sku)
                product_sku.save()

                if sku_stock > 0:
                    StockTransaction.objects.create(
                        product=product,
                        product_sku=product_sku,
                        transaction_type='IN',
                        quantity=sku_stock,
                        current_stock=sku_stock
                    )
                logger.info(
                    f"ProductSKU '{product_sku.sku_code}' created successfully with stock {sku_stock}.")

            except Exception as e:
                logger.error(
                    f"Error creating ProductSKU for product '{product.ProductName}' with data {sku_data}: {e}", exc_info=True)
                raise

        return product

    def update(self, instance, validated_data):
        instance.ProductName = validated_data.get(
            'ProductName', instance.ProductName)
        instance.ProductCode = validated_data.get(
            'ProductCode', instance.ProductCode)
        instance.HSNCode = validated_data.get('HSNCode', instance.HSNCode)
        instance.Active = validated_data.get('Active', instance.Active)

        product_image = validated_data.get('ProductImage')
        if product_image is not None:
            instance.ProductImage = product_image

        instance.save()
        return instance
