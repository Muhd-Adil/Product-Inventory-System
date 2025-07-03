# backend/stock/serializers.py

from rest_framework import serializers
from .models import StockTransaction
from products.models import Products, ProductSKU, Variant, SubVariant  # Import new models


class StockTransactionSerializer(serializers.ModelSerializer):
    # Display product name
    product_name = serializers.CharField(
        source='product.ProductName', read_only=True)
    # Display SKU code
    sku_code = serializers.CharField(
        source='product_sku.sku_code', read_only=True)
    # Display combined options for the SKU
    product_sku_options = serializers.SerializerMethodField()

    class Meta:
        model = StockTransaction
        fields = [
            'id', 'product_name', 'sku_code', 'product_sku_options',
            'transaction_type', 'quantity', 'transaction_date', 'current_stock'
        ]
        read_only_fields = ['id', 'product_name', 'sku_code',
                            'product_sku_options', 'transaction_date', 'current_stock']

    def get_product_sku_options(self, obj):
        # Get the options associated with the ProductSKU, e.g., "Red, S"
        return ", ".join([sv.option for sv in obj.product_sku.sub_variants.all().order_by('variant__name', 'option')])
