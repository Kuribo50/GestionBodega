# gestion/urls.py

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from gestion.views import (
    ArticuloViewSet,
    MovimientoViewSet,
    CategoriaViewSet,
    TaskViewSet,
    UbicacionViewSet,
    HistorialStockViewSet,
    MarcaViewSet,
    ModeloViewSet,
    MotivoViewSet,
    EstadoArticuloViewSet,
    PersonalViewSet,
    HistorialPrestamoViewSet,
    ArticuloStockAPIView,
    MovimientoHistoryView,
    ArticuloListView,
    CambiarEstadoArticuloAPIView,
    UserViewSet,
    UsuarioDetailView
)

router = DefaultRouter()
router.register(r'articulos', ArticuloViewSet, basename='articulos')
router.register(r'movimientos', MovimientoViewSet, basename='movimientos')
router.register(r'categorias', CategoriaViewSet, basename='categorias')
router.register(r'ubicaciones', UbicacionViewSet, basename='ubicaciones')
router.register(r'historial-stock', HistorialStockViewSet, basename='historial_stock')
router.register(r'marcas', MarcaViewSet, basename='marcas')
router.register(r'modelos', ModeloViewSet, basename='modelos')
router.register(r'motivos', MotivoViewSet, basename='motivos')
router.register(r'estados', EstadoArticuloViewSet, basename='estados')
router.register(r'personal', PersonalViewSet, basename='personal')
router.register(r'historial-prestamo', HistorialPrestamoViewSet, basename='historial_prestamo')
router.register(r'usuarios', UserViewSet, basename='usuarios')
router.register(r'tasks', TaskViewSet, basename='task')

urlpatterns = [
    path('', include(router.urls)),
    path('articulos/<int:pk>/stock/', ArticuloStockAPIView.as_view(), name='articulo-stock'),
    path('articulos/<int:pk>/historial/', MovimientoHistoryView.as_view(), name='movimiento-history'),
    path('articulos-list/', ArticuloListView.as_view(), name='articulo-list'),
    path('cambiar-estado-articulo/<int:pk>/', CambiarEstadoArticuloAPIView.as_view(), name='cambiar_estado_articulo'),
    path('user/', UsuarioDetailView.as_view(), name='user_detail'),
]
