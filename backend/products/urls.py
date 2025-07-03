from django.urls import path
from .views import (
    ProductCreateAPIView, ProductListAPIView, AddStockAPIView,
    RemoveStockAPIView)

urlpatterns = [
    path('products/create/', ProductCreateAPIView.as_view(), name='product-create'),
    path('products/', ProductListAPIView.as_view(), name='product-list'),
    path('stock/add/', AddStockAPIView.as_view(), name='stock-add'),
    path('stock/remove/', RemoveStockAPIView.as_view(), name='stock-remove'),

]
