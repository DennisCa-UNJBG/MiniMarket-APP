import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { sucursalService } from '../Service';
import { dateUtils } from '../../../shared/lib/dateUtils';

interface UseSucursalDetalleProps {
  sucursalCodigo: string;
}

export function useSucursalDetalle({ sucursalCodigo }: UseSucursalDetalleProps) {
  // Pestaña activa
  const [activeTab, setActiveTab] = useState<'stock' | 'ventas' | 'kardex' | 'compras' | 'cajas' | 'reportes'>('stock');

  // Filtros de búsqueda
  const [searchTerms, setSearchTerms] = useState({
    stock: '',
    ventas: '',
    kardex: '',
    compras: '',
    cajas: ''
  });

  // Rango de fechas por defecto (Primer día del mes actual al día de hoy)
  const defaultDesde = useMemo(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
  }, []);

  const defaultHasta = useMemo(() => {
    return new Date().toISOString().split('T')[0];
  }, []);

  const [fechaInicio, setFechaInicio] = useState(defaultDesde);
  const [fechaFin, setFechaFin] = useState(defaultHasta);
  const [fechaShortcut, setFechaShortcut] = useState<'hoy' | '7dias' | 'esteMes' | 'mesAnterior' | 'custom'>('esteMes');

  const handleShortcutClick = (shortcut: 'hoy' | '7dias' | 'esteMes' | 'mesAnterior') => {
    setFechaShortcut(shortcut);
    const hoy = new Date();
    if (shortcut === 'hoy') {
      const dateStr = dateUtils.formatToLocalISO(hoy);
      setFechaInicio(dateStr);
      setFechaFin(dateStr);
    } else if (shortcut === '7dias') {
      const sieteDiasAgo = new Date();
      sieteDiasAgo.setDate(hoy.getDate() - 6);
      setFechaInicio(dateUtils.formatToLocalISO(sieteDiasAgo));
      setFechaFin(dateUtils.formatToLocalISO(hoy));
    } else if (shortcut === 'esteMes') {
      const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
      setFechaInicio(dateUtils.formatToLocalISO(primerDiaMes));
      setFechaFin(dateUtils.formatToLocalISO(hoy));
    } else if (shortcut === 'mesAnterior') {
      const primerDiaMesAnterior = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1);
      const ultimoDiaMesAnterior = new Date(hoy.getFullYear(), hoy.getMonth(), 0);
      setFechaInicio(dateUtils.formatToLocalISO(primerDiaMesAnterior));
      setFechaFin(dateUtils.formatToLocalISO(ultimoDiaMesAnterior));
    }
  };

  const handleFechaInicioChange = (val: string) => {
    setFechaInicio(val);
    setFechaShortcut('custom');
  };

  const handleFechaFinChange = (val: string) => {
    setFechaFin(val);
    setFechaShortcut('custom');
  };

  // Queries de datos
  const { data: stock = [], refetch: refetchStock, isLoading: loadingStock } = useQuery({
    queryKey: ['sucursal-stock', sucursalCodigo],
    queryFn: () => sucursalService.getSucursalStock(sucursalCodigo),
  });

  const { data: ventas = [], isLoading: loadingVentas } = useQuery({
    queryKey: ['sucursal-ventas', sucursalCodigo],
    queryFn: () => sucursalService.getSucursalVentas(sucursalCodigo),
  });

  const { data: kardex = [], isLoading: loadingKardex } = useQuery({
    queryKey: ['sucursal-kardex', sucursalCodigo],
    queryFn: () => sucursalService.getSucursalKardex(sucursalCodigo),
  });

  const { data: compras = [], isLoading: loadingCompras } = useQuery({
    queryKey: ['sucursal-compras', sucursalCodigo],
    queryFn: () => sucursalService.getSucursalCompras(sucursalCodigo),
  });

  const { data: cajas = [], isLoading: loadingCajas } = useQuery({
    queryKey: ['sucursal-cajas', sucursalCodigo],
    queryFn: () => sucursalService.getSucursalCajas(sucursalCodigo),
  });

  // Queries reactivos para Reportes
  const { data: reporteFinanzas = { total_ventas: 0, cant_ventas: 0, total_compras: 0, cant_compras: 0, total_productos: 0 }, isLoading: loadingFinanzas } = useQuery({
    queryKey: ['sucursal-reporte-finanzas', sucursalCodigo, fechaInicio, fechaFin],
    queryFn: () => sucursalService.getSucursalReporteFinanzas(sucursalCodigo, fechaInicio, fechaFin),
  });

  const { data: topProductos = [], isLoading: loadingTopProductos } = useQuery({
    queryKey: ['sucursal-reporte-productos', sucursalCodigo, fechaInicio, fechaFin],
    queryFn: () => sucursalService.getSucursalReporteProductosMasVendidos(sucursalCodigo, fechaInicio, fechaFin),
  });

  const { data: ventasDiarias = [], isLoading: loadingVentasDiarias } = useQuery({
    queryKey: ['sucursal-reporte-ventas-diarias', sucursalCodigo, fechaInicio, fechaFin],
    queryFn: () => sucursalService.getSucursalReporteVentasDiarias(sucursalCodigo, fechaInicio, fechaFin),
  });

  const { data: reporteFinanzasPrevio = { total_ventas: 0, cant_ventas: 0, total_compras: 0, cant_compras: 0, total_productos: 0 } } = useQuery({
    queryKey: ['sucursal-reporte-finanzas-previo', sucursalCodigo, fechaInicio, fechaFin],
    queryFn: async () => {
      const start = new Date(fechaInicio);
      const end = new Date(fechaFin);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

      const startPrev = new Date(start);
      startPrev.setDate(start.getDate() - diffDays);
      const endPrev = new Date(start);
      endPrev.setDate(start.getDate() - 1);

      const desdePrev = startPrev.toISOString().split('T')[0];
      const hastaPrev = endPrev.toISOString().split('T')[0];

      return sucursalService.getSucursalReporteFinanzas(sucursalCodigo, desdePrev, hastaPrev);
    }
  });

  // Métricas de cabecera resumidas
  const metrics = useMemo(() => {
    const totalStock = stock.reduce((sum, item) => sum + (item.stock || 0), 0);
    const salesCount = ventas.length;
    const totalRevenue = ventas
      .filter((v: any) => v.estado !== 'anulado')
      .reduce((sum, v) => sum + (v.total || 0), 0);

    return {
      totalStock,
      salesCount,
      totalRevenue
    };
  }, [stock, ventas]);

  // Búsqueda en los listados
  const filteredStock = useMemo(() => {
    const term = searchTerms.stock.toLowerCase().trim();
    if (!term) return stock;
    return stock.filter(
      (item: any) =>
        item.producto_nombre?.toLowerCase().includes(term) ||
        item.codigo_barras?.toLowerCase().includes(term) ||
        item.categoria_nombre?.toLowerCase().includes(term)
    );
  }, [stock, searchTerms.stock]);

  const filteredVentas = useMemo(() => {
    const term = searchTerms.ventas.toLowerCase().trim();
    if (!term) return ventas;
    return ventas.filter(
      (v: any) =>
        v.id.toString().includes(term) ||
        v.usuario_nombre?.toLowerCase().includes(term) ||
        v.cliente_nombre?.toLowerCase().includes(term) ||
        v.documento_referencia?.toLowerCase().includes(term)
    );
  }, [ventas, searchTerms.ventas]);

  const filteredKardex = useMemo(() => {
    const term = searchTerms.kardex.toLowerCase().trim();
    if (!term) return kardex;
    return kardex.filter(
      (k: any) =>
        k.producto_nombre?.toLowerCase().includes(term) ||
        k.tipo_movimiento?.toLowerCase().includes(term) ||
        k.motivo?.toLowerCase().includes(term) ||
        k.documento_referencia?.toLowerCase().includes(term)
    );
  }, [kardex, searchTerms.kardex]);

  const filteredCompras = useMemo(() => {
    const term = searchTerms.compras.toLowerCase().trim();
    if (!term) return compras;
    return compras.filter(
      (c: any) =>
        c.id.toString().includes(term) ||
        c.usuario_nombre?.toLowerCase().includes(term) ||
        c.proveedor_nombre?.toLowerCase().includes(term) ||
        c.documento_referencia?.toLowerCase().includes(term)
    );
  }, [compras, searchTerms.compras]);

  const filteredCajas = useMemo(() => {
    const term = searchTerms.cajas.toLowerCase().trim();
    if (!term) return cajas;
    return cajas.filter(
      (cj: any) =>
        cj.id.toString().includes(term) ||
        cj.usuario_nombre?.toLowerCase().includes(term) ||
        cj.estado?.toLowerCase().includes(term)
    );
  }, [cajas, searchTerms.cajas]);

  // Datos de comparación (Reportes)
  const comparisonStats = useMemo(() => {
    const totalVentas = reporteFinanzas.total_ventas || 0;
    const cantVentas = reporteFinanzas.cant_ventas || 0;
    const totalProductos = reporteFinanzas.total_productos || 0;
    const gastoPromedio = cantVentas > 0 ? totalVentas / cantVentas : 0;

    const totalVentasPrev = reporteFinanzasPrevio.total_ventas || 0;
    const cantVentasPrev = reporteFinanzasPrevio.cant_ventas || 0;
    const totalProductosPrev = reporteFinanzasPrevio.total_productos || 0;
    const gastoPromedioPrev = cantVentasPrev > 0 ? totalVentasPrev / cantVentasPrev : 0;

    const calcPct = (curr: number, prev: number) => {
      if (prev === 0) return curr > 0 ? '+100.0%' : '0.0%';
      const pct = ((curr - prev) / prev) * 100;
      return `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`;
    };

    return {
      totalVentas,
      cantVentas,
      totalProductos,
      gastoPromedio,
      pctVentas: calcPct(totalVentas, totalVentasPrev),
      pctCantVentas: calcPct(cantVentas, cantVentasPrev),
      pctProductos: calcPct(totalProductos, totalProductosPrev),
      pctGastoProm: calcPct(gastoPromedio, gastoPromedioPrev)
    };
  }, [reporteFinanzas, reporteFinanzasPrevio]);

  const formatChartDate = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length < 3) return dateStr;
    const day = parseInt(parts[2], 10).toString();
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const monthIdx = parseInt(parts[1], 10) - 1;
    const monthName = months[monthIdx] || '';
    return `${day} ${monthName}`;
  };

  const chartData = useMemo(() => {
    const start = new Date(fechaInicio);
    const end = new Date(fechaFin);
    const datesMap: { [key: string]: number } = {};

    ventasDiarias.forEach((item: any) => {
      datesMap[item.dia] = item.total || 0;
    });

    const list = [];
    const curr = new Date(start);
    let limit = 0;
    while (curr <= end && limit < 100) {
      const dateStr = curr.toISOString().split('T')[0];
      const total = datesMap[dateStr] || 0;
      list.push({
        dateStr,
        name: formatChartDate(dateStr),
        'Ingresos': total
      });
      curr.setDate(curr.getDate() + 1);
      limit++;
    }
    return list;
  }, [ventasDiarias, fechaInicio, fechaFin]);

  const maxQuantity = useMemo(() => {
    if (topProductos.length === 0) return 1;
    return Math.max(...topProductos.map((p: any) => p.total_cantidad || 1));
  }, [topProductos]);

  const loading = useMemo(() => {
    return (
      loadingStock ||
      loadingVentas ||
      loadingKardex ||
      loadingCompras ||
      loadingCajas ||
      loadingFinanzas ||
      loadingTopProductos ||
      loadingVentasDiarias
    );
  }, [
    loadingStock,
    loadingVentas,
    loadingKardex,
    loadingCompras,
    loadingCajas,
    loadingFinanzas,
    loadingTopProductos,
    loadingVentasDiarias
  ]);

  return {
    activeTab,
    setActiveTab,
    searchTerms,
    setSearchTerms,
    fechaInicio,
    fechaFin,
    fechaShortcut,
    handleShortcutClick,
    handleFechaInicioChange,
    handleFechaFinChange,
    stock,
    ventas,
    kardex,
    compras,
    cajas,
    refetchStock,
    metrics,
    filteredStock,
    filteredVentas,
    filteredKardex,
    filteredCompras,
    filteredCajas,
    comparisonStats,
    chartData,
    maxQuantity,
    topProductos,
    loading
  };
}
