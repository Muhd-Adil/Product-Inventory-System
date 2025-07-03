from django.urls import path
from .views import StockReportAPIView

urlpatterns = [
    path('stock/report/', StockReportAPIView.as_view(), name='stock-report'),
]
