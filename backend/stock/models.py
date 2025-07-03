# backend/stock/models.py

import uuid
from django.db import models
from django.utils import timezone
from products.models import Products, ProductSKU  # Import ProductSKU


class StockTransaction(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    product = models.ForeignKey(
        Products, on_delete=models.CASCADE, related_name='stock_transactions')
    # Change from SubVariant to ProductSKU
    product_sku = models.ForeignKey(
        ProductSKU, on_delete=models.CASCADE, related_name='stock_transactions')

    TRANSACTION_TYPES = (
        ('IN', 'Stock In (Purchase)'),
        ('OUT', 'Stock Out (Sale)'),
    )
    transaction_type = models.CharField(
        max_length=3, choices=TRANSACTION_TYPES)
    quantity = models.DecimalField(max_digits=10, decimal_places=2)
    transaction_date = models.DateTimeField(default=timezone.now)
    # Stock level after this transaction
    current_stock = models.DecimalField(max_digits=10, decimal_places=2)

    class Meta:
        verbose_name_plural = "Stock Transactions"
        ordering = ['-transaction_date']  # Order by most recent first

    def __str__(self):
        return f"{self.transaction_type} {self.quantity} for {self.product.ProductName} - SKU: {self.product_sku.sku_code}"
