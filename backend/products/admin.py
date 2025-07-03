from django.contrib import admin
from .models import Products, Variant, SubVariant, ProductSKU

# Inline for SubVariant within VariantAdmin


class SubVariantInline(admin.TabularInline):
    model = SubVariant
    extra = 1
    show_change_link = True

# Inline for Variant within ProductAdmin


class VariantInline(admin.TabularInline):
    model = Variant
    extra = 1
    show_change_link = True

# Inline for ProductSKU within ProductAdmin


class ProductSKUInline(admin.TabularInline):
    model = ProductSKU
    extra = 0  # No extra blank forms by default
    show_change_link = True
    readonly_fields = ('sku_code',)  # SKU code is auto-generated


@admin.register(Products)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('ProductName', 'ProductCode', 'TotalStock',
                    'Active', 'CreatedDate', 'UpdatedDate')
    search_fields = ('ProductName', 'ProductCode', 'HSNCode')
    list_filter = ('Active', 'IsFavourite', 'CreatedDate')
    inlines = [VariantInline, ProductSKUInline]
    readonly_fields = ('CreatedDate', 'UpdatedDate', 'ProductID')
    fieldsets = (
        (None, {
            'fields': ('ProductName', 'ProductCode', 'HSNCode', 'ProductImage', 'Active', 'IsFavourite')
        }),
        ('Product Identifiers', {
            'fields': ('ProductID',),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            # CreatedUser is still displayed
            'fields': ('CreatedDate', 'UpdatedDate', 'CreatedUser'),
            'classes': ('collapse',)
        }),
    )

    def save_model(self, request, obj, form, change):
        # Auto-set CreatedUser if not already set (only on creation)
        # This will still assign the user if logged in via admin, otherwise it will be null for API.
        if not obj.pk:
            obj.CreatedUser = request.user
        # Auto-generate ProductID if not set
        if not obj.ProductID:
            last_product = Products.objects.order_by('-ProductID').first()
            obj.ProductID = (
                last_product.ProductID if last_product and last_product.ProductID is not None else 0) + 1
        super().save_model(request, obj, form, change)


@admin.register(Variant)
class VariantAdmin(admin.ModelAdmin):
    list_display = ('name', 'product')
    list_filter = ('product',)
    search_fields = ('name',)
    inlines = [SubVariantInline]


@admin.register(SubVariant)
class SubVariantAdmin(admin.ModelAdmin):
    list_display = ('option', 'variant')
    list_filter = ('variant__name', 'variant__product')
    search_fields = ('option',)


@admin.register(ProductSKU)
class ProductSKUAdmin(admin.ModelAdmin):
    list_display = ('sku_code', 'product', 'stock', 'display_sub_variants')
    search_fields = ('sku_code', 'product__ProductName')
    list_filter = ('product',)
    readonly_fields = ('sku_code',)

    def display_sub_variants(self, obj):
        return ", ".join([sv.option for sv in obj.sub_variants.all().order_by('variant__name', 'option')])
    display_sub_variants.short_description = 'Options'
