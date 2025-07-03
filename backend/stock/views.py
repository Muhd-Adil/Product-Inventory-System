from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend  # Import this
from .models import StockTransaction
# Assuming this is the serializer
from .serializers import StockTransactionSerializer
import logging

logger = logging.getLogger(__name__)

# ... (other views like ProductCreateAPIView, AddStockAPIView, RemoveStockAPIView) ...

# Task-5: Stock Report API (List transactions with date filter)


class StockReportAPIView(generics.ListAPIView):
    queryset = StockTransaction.objects.all().select_related(
        'product', 'product_sku')  # Optimize query
    serializer_class = StockTransactionSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = {
        # Greater than or equal to, Less than or equal to
        'transaction_date': ['gte', 'lte'],
        # FIX: Change from 'sub_variant__id' to 'product_sku__id'
        # Allow filtering by a specific product SKU ID
        'product_sku__id': ['exact'],
        'product__id': ['exact'],  # Allow filtering by product ID
        'transaction_type': ['exact'],  # Allow filtering by IN/OUT
    }

    def get_queryset(self):
        # You can add custom filtering logic here if needed, beyond filterset_fields
        queryset = super().get_queryset()
        return queryset
