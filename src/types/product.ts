
export interface Product {
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
  group_id?: string;
  group_name?: string;
  brand_id?: string;
  brand_name?: string;
}
