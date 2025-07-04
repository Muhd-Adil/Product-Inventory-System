from django.contrib import admin
from .models import StockTransaction
# Ensure these are imported if used in admin.py
from products.models import Products, ProductSKU

# Register your models here.


@admin.register(StockTransaction)
class StockTransactionAdmin(admin.ModelAdmin):
    list_display = ('transaction_date', 'product', 'product_sku',
                    'transaction_type', 'quantity', 'current_stock')
    list_filter = ('transaction_type', 'transaction_date',
                   'product__ProductName', 'product_sku__sku_code')
    search_fields = ('product__ProductName', 'product_sku__sku_code')
    readonly_fields = ('transaction_date', 'product', 'product_sku',
                       'transaction_type', 'quantity', 'current_stock')
    date_hierarchy = 'transaction_date'
