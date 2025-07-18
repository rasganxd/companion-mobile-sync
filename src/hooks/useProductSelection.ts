import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { getDatabaseAdapter } from '@/services/DatabaseAdapter';
import { useProductPriceValidation } from '@/hooks/useProductPriceValidation';
import { useUnitSelection } from '@/hooks/useUnitSelection';

interface Product {
  id: string;
  name: string;
  price: number;
  sale_price?: number;
  cost_price?: number;
  code: number;
  stock: number;
  unit?: string;
  cost?: number;
  has_subunit?: boolean;
  subunit?: string;
  subunit_ratio?: number;
  main_unit_id?: string;
  sub_unit_id?: string;
  max_discount_percent?: number;
  category_id?: string;
  category_name?: string;
  // ✅ NOVO: Campos para ordenação hierárquica
  group_name?: string;
  brand_name?: string;
}

interface OrderItem {
  id: number;
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  code: string;
  unit: string;
}

interface ProductsByCategory {
  categoryId: string;
  categoryName: string;
  products: Product[];
}

export const useProductSelection = (onAddItem: (item: OrderItem) => void) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [productsByCategory, setProductsByCategory] = useState<ProductsByCategory[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [unitPrice, setUnitPrice] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentProductIndex, setCurrentProductIndex] = useState(0);

  // Usar o hook de seleção de unidades
  const { 
    unitOptions, 
    selectedUnit, 
    selectedUnitType, 
    setSelectedUnitType, 
    hasMultipleUnits 
  } = useUnitSelection(selectedProduct);

  // ✅ MODIFICADO: Passa o `selectedUnitType` para o hook de validação de preço.
  // Isso garante que a validação sempre saiba se o preço é para a unidade principal ou sub-unidade.
  const { checkPriceAndNotify, hasDiscountRestriction } = useProductPriceValidation(selectedProduct, selectedUnitType);

  useEffect(() => {
    loadProducts();
  }, []);

  // Auto-selecionar primeiro produto quando a lista estiver carregada
  useEffect(() => {
    if (products.length > 0 && !selectedProduct) {
      console.log('📦 Auto-selecionando primeiro produto:', products[0]);
      selectProduct(products[0]);
    }
  }, [products, selectedProduct]);

  // Atualizar preço automaticamente quando a unidade selecionada mudar
  useEffect(() => {
    if (selectedUnit) {
      console.log('📏 Unidade mudou, atualizando preço:', {
        unitType: selectedUnitType,
        unitPrice: selectedUnit.price,
        unitLabel: selectedUnit.label
      });
      setUnitPrice(selectedUnit.price);
    }
  }, [selectedUnit, selectedUnitType]);

  const loadProducts = async () => {
    try {
      console.log('🚀 [PRODUCT SELECTION LOG] Starting loadProducts()');
      const db = getDatabaseAdapter();
      const productsData = await db.getProducts();
      console.log('📦 [PRODUCT SELECTION LOG] Raw products from database:', productsData.length);
      
      // ✅ NOVO: Log estatísticas detalhadas dos produtos carregados
      console.log('📊 [PRODUCT SELECTION LOG] Products loaded from SQLite:');
      console.log(`  - Total products: ${productsData.length}`);
      
      // Sample dos primeiros produtos
      if (productsData.length > 0) {
        console.log('🔍 [PRODUCT SELECTION LOG] First 3 products from SQLite:');
        productsData.slice(0, 3).forEach((product, idx) => {
          console.log(`  ${idx + 1}. ${product.name}: code=${product.code}(${typeof product.code}), sale_price=${product.sale_price}(${typeof product.sale_price}), unit=${product.unit}`);
        });
      }
      
      // Validar que apenas produtos reais são carregados
      const validProducts = productsData.filter(product => {
        const isValid = product.id && 
                       product.name && 
                       (typeof product.sale_price === 'number' || (typeof product.sale_price === 'string' && !isNaN(parseFloat(product.sale_price)))) &&
                       (typeof product.code === 'number' || (typeof product.code === 'string' && !isNaN(parseInt(product.code))));
        
        if (!isValid) {
          console.warn('⚠️ [PRODUCT SELECTION LOG] Invalid product filtered:', {
            name: product.name,
            id: product.id,
            sale_price: product.sale_price,
            sale_price_type: typeof product.sale_price,
            code: product.code,
            code_type: typeof product.code
          });
        }
        
        return isValid;
      });
      
      console.log(`✅ [PRODUCT SELECTION LOG] ${validProducts.length} valid products after filtering (from ${productsData.length} total)`);
      
      // ✅ CORREÇÃO: Normalizar produtos garantindo que unidades sejam preservadas
      const normalizedProducts = validProducts.map(product => {
        const normalizedProduct = {
          ...product,
          price: product.sale_price || product.price || 0,
          sale_price: product.sale_price || product.price || 0,
          max_discount_percent: product.max_discount_percent || 0,
          category_name: product.category_name || 'Sem Categoria',
          group_name: product.group_name || 'Sem Grupo',
          brand_name: product.brand_name || 'Sem Marca',
          // ✅ CRÍTICO: Garantir que unidades sejam preservadas e não sobrescritas
          unit: product.unit || 'UN', // Usar 'UN' apenas como fallback se realmente não tiver unidade
          has_subunit: Boolean(product.has_subunit),
          subunit: product.subunit || undefined,
          subunit_ratio: product.subunit_ratio || undefined
        };
        
        // ✅ DEBUG: Log produtos com unidades diferentes de 'UN'
        if (product.unit && product.unit !== 'UN') {
          console.log(`📦 [PRODUCT SELECTION LOG] Product with special unit:`, {
            name: product.name,
            code: product.code,
            unit: product.unit,
            has_subunit: product.has_subunit,
            subunit: product.subunit,
            subunit_ratio: product.subunit_ratio
          });
        }
        
        return normalizedProduct;
      });
      
      // ✅ NOVO: Implementar ordenação hierárquica (Grupo → Marca → Categoria → Nome)
      console.log('🔄 [PRODUCT SELECTION LOG] Applying hierarchical order: Grupo → Marca → Categoria → Nome');
      
      const hierarchicallySortedProducts = normalizedProducts.sort((a, b) => {
        // 1. Primeiro por Grupo
        const groupComparison = (a.group_name || '').localeCompare(b.group_name || '');
        if (groupComparison !== 0) return groupComparison;
        
        // 2. Depois por Marca
        const brandComparison = (a.brand_name || '').localeCompare(b.brand_name || '');
        if (brandComparison !== 0) return brandComparison;
        
        // 3. Depois por Categoria
        const categoryComparison = (a.category_name || '').localeCompare(b.category_name || '');
        if (categoryComparison !== 0) return categoryComparison;
        
        // 4. Por último por Nome
        return a.name.localeCompare(b.name);
      });
      
      console.log('✅ [PRODUCT SELECTION LOG] Products sorted hierarchically:', {
        total: hierarchicallySortedProducts.length,
        firstProduct: {
          name: hierarchicallySortedProducts[0]?.name,
          unit: hierarchicallySortedProducts[0]?.unit,
          group: hierarchicallySortedProducts[0]?.group_name,
          brand: hierarchicallySortedProducts[0]?.brand_name,
          category: hierarchicallySortedProducts[0]?.category_name
        },
        lastProduct: {
          name: hierarchicallySortedProducts[hierarchicallySortedProducts.length - 1]?.name,
          unit: hierarchicallySortedProducts[hierarchicallySortedProducts.length - 1]?.unit,
          group: hierarchicallySortedProducts[hierarchicallySortedProducts.length - 1]?.group_name,
          brand: hierarchicallySortedProducts[hierarchicallySortedProducts.length - 1]?.brand_name,
          category: hierarchicallySortedProducts[hierarchicallySortedProducts.length - 1]?.category_name
        }
      });
      
      // ✅ DEBUG: Contar produtos por tipo de unidade
      const unitStats = hierarchicallySortedProducts.reduce((stats, product) => {
        const unit = product.unit || 'UNDEFINED';
        stats[unit] = (stats[unit] || 0) + 1;
        return stats;
      }, {} as Record<string, number>);
      
      console.log('📊 [PRODUCT SELECTION LOG] Unit statistics of products:', unitStats);
      
      // Agrupar produtos por categoria (mantendo para compatibilidade com componentes existentes)
      const groupedByCategory: Record<string, ProductsByCategory> = hierarchicallySortedProducts.reduce((acc, product) => {
        const categoryId = product.category_id || 'no-category';
        const categoryName = product.category_name || 'Sem Categoria';
        
        if (!acc[categoryId]) {
          acc[categoryId] = {
            categoryId,
            categoryName,
            products: []
          };
        }
        
        acc[categoryId].products.push(product);
        return acc;
      }, {} as Record<string, ProductsByCategory>);

      // Converter para array e manter ordem hierárquica
      const categoriesArray = Object.values(groupedByCategory);

      console.log('📂 [PRODUCT SELECTION LOG] Products grouped by category (maintaining hierarchical order):', categoriesArray);
      
      setProductsByCategory(categoriesArray);
      
      // ✅ MODIFICADO: Usar produtos já ordenados hierarquicamente
      setProducts(hierarchicallySortedProducts);
      
      console.log(`🎯 [PRODUCT SELECTION LOG] Final products loaded: ${hierarchicallySortedProducts.length}`);
      
      // ✅ DEBUG: Log detalhado dos produtos para debug de unidades
      hierarchicallySortedProducts.forEach((product, index) => {
        if (index < 10 && product.unit !== 'UN') { // Log primeiros 10 produtos com unidades especiais
          console.log(`📦 [PRODUCT SELECTION LOG] Product ${index + 1} WITH SPECIAL UNIT:`, {
            id: product.id,
            name: product.name,
            code: product.code,
            unit: product.unit,
            has_subunit: product.has_subunit,
            subunit: product.subunit,
            subunit_ratio: product.subunit_ratio,
            category: product.category_name,
            max_discount_percent: product.max_discount_percent
          });
        }
      });
      
    } catch (error) {
      console.error('❌ [PRODUCT SELECTION LOG] Error loading products:', error);
      toast.error('Erro ao carregar produtos');
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.code.toString().includes(searchTerm) ||
    (product.category_name && product.category_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (product.group_name && product.group_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (product.brand_name && product.brand_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const selectProduct = (product: Product) => {
    console.log('📦 PRODUTO SELECIONADO:', {
      id: product.id,
      name: product.name,
      group: product.group_name,
      brand: product.brand_name,
      category: product.category_name,
      code: product.code,
      sale_price: product.sale_price,
      max_discount_percent: product.max_discount_percent,
      hasDiscountRestriction: (product.max_discount_percent && product.max_discount_percent > 0),
      hasSubunit: product.has_subunit,
      subunit: product.subunit,
      subunitRatio: product.subunit_ratio
    });
    
    setSelectedProduct(product);
    
    // Atualizar índice do produto atual
    const index = products.findIndex(p => p.id === product.id);
    if (index !== -1) {
      setCurrentProductIndex(index);
    }
    
    console.log('💰 Desconto máximo configurado:', product.max_discount_percent || 'Nenhum');
    console.log('🏷️ Hierarquia:', `${product.group_name} → ${product.brand_name} → ${product.category_name}`);
    
    // Log informações sobre unidades
    if (product.has_subunit) {
      console.log('📏 Produto com subunidade:', {
        unidadePrincipal: product.unit,
        subunidade: product.subunit,
        ratio: product.subunit_ratio
      });
    }
  };

  const moveToNextProduct = () => {
    if (products.length === 0) return;

    const nextIndex = currentProductIndex < products.length - 1 ? currentProductIndex + 1 : 0;
    const nextProduct = products[nextIndex];
    
    console.log('➡️ Movendo para próximo produto:', {
      from: { index: currentProductIndex, name: selectedProduct?.name },
      to: { index: nextIndex, name: nextProduct.name, category: nextProduct.category_name }
    });
    
    setCurrentProductIndex(nextIndex);
    selectProduct(nextProduct);
  };

  const getCurrentCategoryInfo = () => {
    if (!selectedProduct) return null;
    
    const category = productsByCategory.find(cat => 
      cat.products.some(p => p.id === selectedProduct.id)
    );
    
    if (!category) return null;
    
    const productIndexInCategory = category.products.findIndex(p => p.id === selectedProduct.id);
    const categoryIndex = productsByCategory.findIndex(cat => cat.categoryId === category.categoryId);
    
    return {
      categoryName: category.categoryName,
      categoryIndex: categoryIndex + 1,
      totalCategories: productsByCategory.length,
      productIndexInCategory: productIndexInCategory + 1,
      totalProductsInCategory: category.products.length
    };
  };

  const addProduct = () => {
    console.log('🔍 INICIANDO ADIÇÃO DE PRODUTO:', {
      selectedProduct: selectedProduct?.name || 'Nenhum',
      quantity,
      unitPrice,
      selectedUnit: selectedUnit?.label || 'Nenhuma',
      hasProduct: !!selectedProduct
    });

    if (!selectedProduct || quantity <= 0 || !selectedUnit) {
      toast.error('Selecione um produto, unidade e quantidade válida');
      return;
    }

    // VALIDAÇÃO CRÍTICA: Verificar desconto máximo antes de adicionar
    console.log('🔍 VALIDAÇÃO DE DESCONTO - Verificando:', {
      productName: selectedProduct.name,
      unitPrice,
      maxDiscountPercent: selectedProduct.max_discount_percent,
      hasDiscountRestriction: hasDiscountRestriction()
    });

    // Esta é a validação que deve impedir a adição se o desconto for excedido
    // ✅ CORREÇÃO: `checkPriceAndNotify` agora tem a lógica correta para unidades compostas.
    const priceIsValid = checkPriceAndNotify(unitPrice);
    
    if (!priceIsValid) {
      console.log('❌ PREÇO INVÁLIDO - Produto NÃO será adicionado');
      console.log('❌ Motivo: Desconto excede o limite máximo permitido');
      return;
    }

    console.log('✅ PREÇO VÁLIDO - Prosseguindo com adição do produto');

    const newItem: OrderItem = {
      id: Date.now(),
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      quantity,
      price: unitPrice,
      code: selectedProduct.code.toString(),
      unit: selectedUnit.label
    };

    console.log('➕ ADICIONANDO ITEM AO PEDIDO:', {
      productName: newItem.productName,
      quantity: newItem.quantity,
      unit: newItem.unit,
      price: newItem.price,
      category: selectedProduct.category_name,
      maxDiscountPercent: selectedProduct.max_discount_percent,
      totalItem: (newItem.quantity * newItem.price).toFixed(2)
    });
    
    onAddItem(newItem);
    
    // Em vez de limpar completamente, mover para o próximo produto
    setQuantity(1);
    setUnitPrice(0);
    setSearchTerm('');
    
    // Mover para próximo produto automaticamente
    moveToNextProduct();
    
    console.log('✅ PRODUTO ADICIONADO E MOVIDO PARA O PRÓXIMO');
  };

  const clearSelection = () => {
    setSelectedProduct(null);
    setQuantity(1);
    setUnitPrice(0);
    setSearchTerm('');
    setCurrentProductIndex(0);
  };

  return {
    products: filteredProducts,
    productsByCategory,
    selectedProduct,
    quantity,
    unitPrice,
    searchTerm,
    currentProductIndex,
    unitOptions,
    selectedUnit,
    selectedUnitType,
    hasMultipleUnits,
    selectProduct,
    setQuantity,
    setUnitPrice,
    setSearchTerm,
    setSelectedUnitType,
    setCurrentProductIndex,
    addProduct,
    clearSelection,
    moveToNextProduct,
    getCurrentCategoryInfo
  };
};
