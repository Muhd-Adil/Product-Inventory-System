import uuid
from django.db import models
from django.utils.translation import gettext_lazy as _
from versatileimagefield.fields import VersatileImageField
from django.db.models import Sum

from django.contrib.auth import get_user_model
User = get_user_model()


class Products(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    ProductID = models.BigIntegerField(unique=True)
    ProductCode = models.CharField(max_length=255, unique=True)
    ProductName = models.CharField(max_length=255)
    ProductImage = VersatileImageField(
        upload_to="uploads/", blank=True, null=True)
    CreatedDate = models.DateTimeField(auto_now_add=True)
    UpdatedDate = models.DateTimeField(blank=True, null=True)
    CreatedUser = models.ForeignKey(
        User, related_name='%(class)s_objects', on_delete=models.SET_NULL, null=True, blank=True)
    IsFavourite = models.BooleanField(default=False)
    Active = models.BooleanField(default=False)
    HSNCode = models.CharField(max_length=255, blank=True, null=True)

    class Meta:
        unique_together = ('ProductCode', 'ProductID',)
        ordering = ['-CreatedDate']

    def __str__(self):
        return self.ProductName

    @property
    def TotalStock(self):
        return self.productsku_set.aggregate(total=Sum('stock'))['total'] or 0.00


class Variant(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    product = models.ForeignKey(
        Products, related_name='variants', on_delete=models.CASCADE)
    name = models.CharField(max_length=100)

    class Meta:
        unique_together = ('product', 'name',)
        ordering = ['name']

    def __str__(self):
        return f"{self.product.ProductName} - {self.name}"


class SubVariant(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    variant = models.ForeignKey(
        Variant, related_name='sub_variants', on_delete=models.CASCADE)
    option = models.CharField(max_length=100)

    class Meta:
        unique_together = ('variant', 'option',)
        ordering = ['option']

    def __str__(self):
        return f"{self.variant.name}: {self.option}"


class ProductSKU(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    product = models.ForeignKey(
        Products, related_name='productsku_set', on_delete=models.CASCADE)
    stock = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    sub_variants = models.ManyToManyField(
        SubVariant, related_name='product_skus')
    sku_code = models.CharField(max_length=255, unique=True, blank=True)

    class Meta:
        ordering = ['sku_code']

    def __str__(self):
        options_str = ', '.join(
            [sv.option for sv in self.sub_variants.all().order_by('variant__name', 'option')])
        return f"{self.product.ProductName} - {options_str} (SKU: {self.sku_code})"

    def save(self, *args, **kwargs):
        if not self.sku_code:
            product_code = self.product.ProductCode
            options_slug = '-'.join([
                sv.option.replace(' ', '').upper() for sv in self.sub_variants.all().order_by('variant__name', 'option')
            ])
            self.sku_code = f"{product_code}-{options_slug}"
            counter = 0
            original_sku_code = self.sku_code
            while ProductSKU.objects.filter(sku_code=self.sku_code).exists():
                counter += 1
                self.sku_code = f"{original_sku_code}-{counter}"
        super().save(*args, **kwargs)
