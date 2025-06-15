
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
      const db = getDatabaseAdapter();
      const productsData = await db.getProducts();
      console.log('📦 Produtos carregados do banco local:', productsData);
      
      // Validar que apenas produtos reais são carregados
      const validProducts = productsData.filter(product => {
        const isValid = product.id && 
                       product.name && 
                       typeof product.sale_price === 'number' &&
                       typeof product.code === 'number';
        
        if (!isValid) {
          console.warn('⚠️ Produto inválido filtrado:', product);
        }
        
        return isValid;
      });
      
      console.log(`✅ ${validProducts.length} produtos válidos carregados (filtrados de ${productsData.length} total)`);
      
      // Ensure products have the correct price field and max_discount_percent
      const normalizedProducts = validProducts.map(product => ({
        ...product,
        price: product.sale_price || product.price || 0,
        sale_price: product.sale_price || product.price || 0,
        max_discount_percent: product.max_discount_percent || 0,
        category_name: product.category_name || 'Sem Categoria'
      }));
      
      // Agrupar produtos por categoria
      const groupedByCategory: Record<string, ProductsByCategory> = normalizedProducts.reduce((acc, product) => {
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

      // Converter para array e ordenar categorias
      const categoriesArray = Object.values(groupedByCategory).sort((a, b) => 
        a.categoryName.localeCompare(b.categoryName)
      );

      // Ordenar produtos dentro de cada categoria
      categoriesArray.forEach(category => {
        category.products.sort((a, b) => a.name.localeCompare(b.name));
      });

      console.log('📂 Produtos agrupados por categoria:', categoriesArray);
      
      setProductsByCategory(categoriesArray);
      
      // Criar lista plana para navegação mantendo ordem por categoria
      const flatProducts = categoriesArray.flatMap(category => category.products);
      setProducts(flatProducts);
      
      // Log detalhado dos produtos para debug de desconto máximo
      flatProducts.forEach((product, index) => {
        if (product.max_discount_percent && product.max_discount_percent > 0) {
          console.log(`📦 Produto ${index + 1} COM DESCONTO MÁXIMO:`, {
            id: product.id,
            name: product.name,
            category: product.category_name,
            code: product.code,
            sale_price: product.sale_price,
            max_discount_percent: product.max_discount_percent,
            stock: product.stock,
            unit: product.unit
          });
        }
      });
      
    } catch (error) {
      console.error('❌ Erro ao carregar produtos:', error);
      toast.error('Erro ao carregar produtos');
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.code.toString().includes(searchTerm) ||
    (product.category_name && product.category_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const selectProduct = (product: Product) => {
    console.log('📦 PRODUTO SELECIONADO:', {
      id: product.id,
      name: product.name,
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
    console.log('📂 Categoria:', product.category_name || 'Sem categoria');
    
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
