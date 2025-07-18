export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      admin_profiles: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string
          role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          name: string
          role?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string
          role?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          company: Json | null
          company_logo: string | null
          company_name: string
          created_at: string
          id: string
          primary_color: string | null
          updated_at: string
        }
        Insert: {
          company?: Json | null
          company_logo?: string | null
          company_name?: string
          created_at?: string
          id?: string
          primary_color?: string | null
          updated_at?: string
        }
        Update: {
          company?: Json | null
          company_logo?: string | null
          company_name?: string
          created_at?: string
          id?: string
          primary_color?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      customers: {
        Row: {
          active: boolean
          address: string | null
          category: string | null
          city: string | null
          code: number | null
          company_name: string | null
          created_at: string | null
          credit_limit: number | null
          delivery_route_id: string | null
          document: string | null
          email: string | null
          id: string
          name: string
          neighborhood: string | null
          notes: string | null
          payment_terms: string | null
          phone: string | null
          region: string | null
          sales_rep_id: string | null
          state: string | null
          updated_at: string | null
          visit_days: string[] | null
          visit_frequency: string | null
          visit_sequence: number | null
          visit_sequences: Json | null
          zip_code: string | null
        }
        Insert: {
          active?: boolean
          address?: string | null
          category?: string | null
          city?: string | null
          code?: number | null
          company_name?: string | null
          created_at?: string | null
          credit_limit?: number | null
          delivery_route_id?: string | null
          document?: string | null
          email?: string | null
          id?: string
          name: string
          neighborhood?: string | null
          notes?: string | null
          payment_terms?: string | null
          phone?: string | null
          region?: string | null
          sales_rep_id?: string | null
          state?: string | null
          updated_at?: string | null
          visit_days?: string[] | null
          visit_frequency?: string | null
          visit_sequence?: number | null
          visit_sequences?: Json | null
          zip_code?: string | null
        }
        Update: {
          active?: boolean
          address?: string | null
          category?: string | null
          city?: string | null
          code?: number | null
          company_name?: string | null
          created_at?: string | null
          credit_limit?: number | null
          delivery_route_id?: string | null
          document?: string | null
          email?: string | null
          id?: string
          name?: string
          neighborhood?: string | null
          notes?: string | null
          payment_terms?: string | null
          phone?: string | null
          region?: string | null
          sales_rep_id?: string | null
          state?: string | null
          updated_at?: string | null
          visit_days?: string[] | null
          visit_frequency?: string | null
          visit_sequence?: number | null
          visit_sequences?: Json | null
          zip_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_delivery_route_id_fkey"
            columns: ["delivery_route_id"]
            isOneToOne: false
            referencedRelation: "delivery_routes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customers_sales_rep_id_fkey"
            columns: ["sales_rep_id"]
            isOneToOne: false
            referencedRelation: "sales_reps"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_routes: {
        Row: {
          active: boolean
          created_at: string
          date: string | null
          description: string | null
          driver_id: string | null
          driver_name: string | null
          id: string
          last_updated: string | null
          name: string
          sales_rep_id: string | null
          sales_rep_name: string | null
          status: string | null
          stops: Json | null
          updated_at: string
          vehicle_id: string | null
          vehicle_name: string | null
        }
        Insert: {
          active?: boolean
          created_at?: string
          date?: string | null
          description?: string | null
          driver_id?: string | null
          driver_name?: string | null
          id?: string
          last_updated?: string | null
          name: string
          sales_rep_id?: string | null
          sales_rep_name?: string | null
          status?: string | null
          stops?: Json | null
          updated_at?: string
          vehicle_id?: string | null
          vehicle_name?: string | null
        }
        Update: {
          active?: boolean
          created_at?: string
          date?: string | null
          description?: string | null
          driver_id?: string | null
          driver_name?: string | null
          id?: string
          last_updated?: string | null
          name?: string
          sales_rep_id?: string | null
          sales_rep_name?: string | null
          status?: string | null
          stops?: Json | null
          updated_at?: string
          vehicle_id?: string | null
          vehicle_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "delivery_routes_sales_rep_id_fkey"
            columns: ["sales_rep_id"]
            isOneToOne: false
            referencedRelation: "sales_reps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_routes_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      import_reports: {
        Row: {
          created_at: string
          id: string
          operation_type: string
          operator: string
          orders_count: number
          report_data: Json
          sales_reps_count: number
          summary_data: Json
          timestamp: string
          total_value: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          operation_type: string
          operator?: string
          orders_count?: number
          report_data?: Json
          sales_reps_count?: number
          summary_data?: Json
          timestamp?: string
          total_value?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          operation_type?: string
          operator?: string
          orders_count?: number
          report_data?: Json
          sales_reps_count?: number
          summary_data?: Json
          timestamp?: string
          total_value?: number
          updated_at?: string
        }
        Relationships: []
      }
      load_items: {
        Row: {
          created_at: string
          id: string
          load_id: string | null
          order_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          load_id?: string | null
          order_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          load_id?: string | null
          order_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "load_items_load_id_fkey"
            columns: ["load_id"]
            isOneToOne: false
            referencedRelation: "loads"
            referencedColumns: ["id"]
          },
        ]
      }
      loads: {
        Row: {
          code: number
          created_at: string
          date: string
          delivery_date: string | null
          departure_date: string | null
          description: string | null
          driver_id: string | null
          driver_name: string | null
          id: string
          locked: boolean
          name: string
          notes: string | null
          order_ids: Json | null
          return_date: string | null
          route_id: string | null
          route_name: string | null
          sales_rep_id: string | null
          sales_rep_name: string | null
          status: string
          total: number | null
          updated_at: string
          vehicle_id: string | null
          vehicle_name: string | null
        }
        Insert: {
          code?: number
          created_at?: string
          date?: string
          delivery_date?: string | null
          departure_date?: string | null
          description?: string | null
          driver_id?: string | null
          driver_name?: string | null
          id?: string
          locked?: boolean
          name?: string
          notes?: string | null
          order_ids?: Json | null
          return_date?: string | null
          route_id?: string | null
          route_name?: string | null
          sales_rep_id?: string | null
          sales_rep_name?: string | null
          status?: string
          total?: number | null
          updated_at?: string
          vehicle_id?: string | null
          vehicle_name?: string | null
        }
        Update: {
          code?: number
          created_at?: string
          date?: string
          delivery_date?: string | null
          departure_date?: string | null
          description?: string | null
          driver_id?: string | null
          driver_name?: string | null
          id?: string
          locked?: boolean
          name?: string
          notes?: string | null
          order_ids?: Json | null
          return_date?: string | null
          route_id?: string | null
          route_name?: string | null
          sales_rep_id?: string | null
          sales_rep_name?: string | null
          status?: string
          total?: number | null
          updated_at?: string
          vehicle_id?: string | null
          vehicle_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "loads_sales_rep_id_fkey"
            columns: ["sales_rep_id"]
            isOneToOne: false
            referencedRelation: "sales_reps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loads_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_logs: {
        Row: {
          completed_at: string | null
          created_by: string | null
          details: Json | null
          duration_seconds: number | null
          error_message: string | null
          id: string
          operation_type: string
          started_at: string
          status: string
        }
        Insert: {
          completed_at?: string | null
          created_by?: string | null
          details?: Json | null
          duration_seconds?: number | null
          error_message?: string | null
          id?: string
          operation_type: string
          started_at?: string
          status: string
        }
        Update: {
          completed_at?: string | null
          created_by?: string | null
          details?: Json | null
          duration_seconds?: number | null
          error_message?: string | null
          id?: string
          operation_type?: string
          started_at?: string
          status?: string
        }
        Relationships: []
      }
      maintenance_settings: {
        Row: {
          description: string | null
          id: string
          setting_key: string
          setting_value: Json
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          description?: string | null
          id?: string
          setting_key: string
          setting_value?: Json
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          description?: string | null
          id?: string
          setting_key?: string
          setting_value?: Json
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      mobile_order_items: {
        Row: {
          created_at: string
          discount: number | null
          id: string
          mobile_order_id: string | null
          price: number
          product_code: number | null
          product_id: string | null
          product_name: string | null
          quantity: number
          total: number
          unit: string | null
          unit_price: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          discount?: number | null
          id?: string
          mobile_order_id?: string | null
          price: number
          product_code?: number | null
          product_id?: string | null
          product_name?: string | null
          quantity: number
          total: number
          unit?: string | null
          unit_price?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          discount?: number | null
          id?: string
          mobile_order_id?: string | null
          price?: number
          product_code?: number | null
          product_id?: string | null
          product_name?: string | null
          quantity?: number
          total?: number
          unit?: string | null
          unit_price?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mobile_order_items_mobile_order_id_fkey"
            columns: ["mobile_order_id"]
            isOneToOne: false
            referencedRelation: "mobile_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      mobile_orders: {
        Row: {
          code: number
          created_at: string
          customer_code: number | null
          customer_id: string | null
          customer_name: string | null
          date: string
          delivery_address: string | null
          delivery_city: string | null
          delivery_date: string | null
          delivery_state: string | null
          delivery_zip: string | null
          discount: number | null
          due_date: string | null
          id: string
          imported_at: string | null
          imported_by: string | null
          imported_to_orders: boolean | null
          mobile_order_id: string | null
          notes: string | null
          payment_method: string | null
          payment_method_id: string | null
          payment_status: string | null
          payment_table: string | null
          payment_table_id: string | null
          payments: Json | null
          rejection_reason: string | null
          sales_rep_id: string | null
          sales_rep_name: string | null
          status: string
          sync_status: string | null
          total: number
          updated_at: string
          visit_notes: string | null
        }
        Insert: {
          code?: number
          created_at?: string
          customer_code?: number | null
          customer_id?: string | null
          customer_name?: string | null
          date?: string
          delivery_address?: string | null
          delivery_city?: string | null
          delivery_date?: string | null
          delivery_state?: string | null
          delivery_zip?: string | null
          discount?: number | null
          due_date?: string | null
          id?: string
          imported_at?: string | null
          imported_by?: string | null
          imported_to_orders?: boolean | null
          mobile_order_id?: string | null
          notes?: string | null
          payment_method?: string | null
          payment_method_id?: string | null
          payment_status?: string | null
          payment_table?: string | null
          payment_table_id?: string | null
          payments?: Json | null
          rejection_reason?: string | null
          sales_rep_id?: string | null
          sales_rep_name?: string | null
          status?: string
          sync_status?: string | null
          total?: number
          updated_at?: string
          visit_notes?: string | null
        }
        Update: {
          code?: number
          created_at?: string
          customer_code?: number | null
          customer_id?: string | null
          customer_name?: string | null
          date?: string
          delivery_address?: string | null
          delivery_city?: string | null
          delivery_date?: string | null
          delivery_state?: string | null
          delivery_zip?: string | null
          discount?: number | null
          due_date?: string | null
          id?: string
          imported_at?: string | null
          imported_by?: string | null
          imported_to_orders?: boolean | null
          mobile_order_id?: string | null
          notes?: string | null
          payment_method?: string | null
          payment_method_id?: string | null
          payment_status?: string | null
          payment_table?: string | null
          payment_table_id?: string | null
          payments?: Json | null
          rejection_reason?: string | null
          sales_rep_id?: string | null
          sales_rep_name?: string | null
          status?: string
          sync_status?: string | null
          total?: number
          updated_at?: string
          visit_notes?: string | null
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string
          discount: number | null
          id: string
          order_id: string | null
          price: number
          product_code: number | null
          product_name: string | null
          quantity: number
          total: number
          unit: string | null
          unit_price: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          discount?: number | null
          id?: string
          order_id?: string | null
          price: number
          product_code?: number | null
          product_name?: string | null
          quantity: number
          total: number
          unit?: string | null
          unit_price?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          discount?: number | null
          id?: string
          order_id?: string | null
          price?: number
          product_code?: number | null
          product_name?: string | null
          quantity?: number
          total?: number
          unit?: string | null
          unit_price?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          archived: boolean | null
          code: number
          created_at: string
          customer_id: string | null
          customer_name: string | null
          date: string
          delivery_address: string | null
          delivery_city: string | null
          delivery_date: string | null
          delivery_state: string | null
          delivery_zip: string | null
          discount: number | null
          due_date: string | null
          id: string
          import_status: string | null
          imported: boolean | null
          imported_at: string | null
          imported_by: string | null
          mobile_order_id: string | null
          notes: string | null
          payment_method: string | null
          payment_method_id: string | null
          payment_status: string | null
          payment_table: string | null
          payment_table_id: string | null
          payments: Json | null
          rejection_reason: string | null
          sales_rep_id: string | null
          sales_rep_name: string | null
          source_project: string
          status: string
          sync_status: string | null
          total: number
          updated_at: string
          visit_notes: string | null
        }
        Insert: {
          archived?: boolean | null
          code?: number
          created_at?: string
          customer_id?: string | null
          customer_name?: string | null
          date?: string
          delivery_address?: string | null
          delivery_city?: string | null
          delivery_date?: string | null
          delivery_state?: string | null
          delivery_zip?: string | null
          discount?: number | null
          due_date?: string | null
          id?: string
          import_status?: string | null
          imported?: boolean | null
          imported_at?: string | null
          imported_by?: string | null
          mobile_order_id?: string | null
          notes?: string | null
          payment_method?: string | null
          payment_method_id?: string | null
          payment_status?: string | null
          payment_table?: string | null
          payment_table_id?: string | null
          payments?: Json | null
          rejection_reason?: string | null
          sales_rep_id?: string | null
          sales_rep_name?: string | null
          source_project?: string
          status?: string
          sync_status?: string | null
          total?: number
          updated_at?: string
          visit_notes?: string | null
        }
        Update: {
          archived?: boolean | null
          code?: number
          created_at?: string
          customer_id?: string | null
          customer_name?: string | null
          date?: string
          delivery_address?: string | null
          delivery_city?: string | null
          delivery_date?: string | null
          delivery_state?: string | null
          delivery_zip?: string | null
          discount?: number | null
          due_date?: string | null
          id?: string
          import_status?: string | null
          imported?: boolean | null
          imported_at?: string | null
          imported_by?: string | null
          mobile_order_id?: string | null
          notes?: string | null
          payment_method?: string | null
          payment_method_id?: string | null
          payment_status?: string | null
          payment_table?: string | null
          payment_table_id?: string | null
          payments?: Json | null
          rejection_reason?: string | null
          sales_rep_id?: string | null
          sales_rep_name?: string | null
          source_project?: string
          status?: string
          sync_status?: string | null
          total?: number
          updated_at?: string
          visit_notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_sales_rep_id_fkey"
            columns: ["sales_rep_id"]
            isOneToOne: false
            referencedRelation: "sales_reps"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_methods: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          notes: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          notes?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          notes?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      payment_tables: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          id: string
          installments: Json | null
          name: string
          notes: string | null
          payable_to: string | null
          payment_location: string | null
          terms: Json | null
          type: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          installments?: Json | null
          name: string
          notes?: string | null
          payable_to?: string | null
          payment_location?: string | null
          terms?: Json | null
          type?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          installments?: Json | null
          name?: string
          notes?: string | null
          payable_to?: string | null
          payment_location?: string | null
          terms?: Json | null
          type?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          customer_name: string
          id: string
          notes: string | null
          order_id: string | null
          payment_date: string
          payment_method: string
          status: string
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          customer_name: string
          id?: string
          notes?: string | null
          order_id?: string | null
          payment_date?: string
          payment_method: string
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          customer_name?: string
          id?: string
          notes?: string | null
          order_id?: string | null
          payment_date?: string
          payment_method?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      product_brands: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          notes: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          notes?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          notes?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      product_categories: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          notes: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          notes?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          notes?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      product_groups: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          notes: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          notes?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          notes?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      products: {
        Row: {
          active: boolean
          brand_id: string | null
          category_id: string | null
          code: number
          cost_price: number
          created_at: string
          group_id: string | null
          id: string
          main_unit_id: string
          max_discount_percent: number | null
          name: string
          sale_price: number
          stock: number
          sub_unit_id: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          brand_id?: string | null
          category_id?: string | null
          code?: number
          cost_price?: number
          created_at?: string
          group_id?: string | null
          id?: string
          main_unit_id: string
          max_discount_percent?: number | null
          name: string
          sale_price?: number
          stock?: number
          sub_unit_id?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          brand_id?: string | null
          category_id?: string | null
          code?: number
          cost_price?: number
          created_at?: string
          group_id?: string | null
          id?: string
          main_unit_id?: string
          max_discount_percent?: number | null
          name?: string
          sale_price?: number
          stock?: number
          sub_unit_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_main_unit_id_fkey"
            columns: ["main_unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_sub_unit_id_fkey"
            columns: ["sub_unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      sale_items: {
        Row: {
          created_at: string | null
          id: string
          price: number
          product_id: string | null
          quantity: number
          sale_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          price: number
          product_id?: string | null
          quantity: number
          sale_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          price?: number
          product_id?: string | null
          quantity?: number
          sale_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sale_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_items_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      sales: {
        Row: {
          created_at: string | null
          customer_id: string | null
          date: string | null
          id: string
          total: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          customer_id?: string | null
          date?: string | null
          id?: string
          total: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          customer_id?: string | null
          date?: string | null
          id?: string
          total?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sales_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_reps: {
        Row: {
          active: boolean
          code: number
          created_at: string
          email: string | null
          id: string
          name: string
          password: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          code?: number
          created_at?: string
          email?: string | null
          id?: string
          name: string
          password?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          code?: number
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          password?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      system_backups: {
        Row: {
          backup_type: string
          created_at: string
          created_by: string | null
          data_snapshot: Json
          description: string | null
          file_size: number
          id: string
          name: string
          notes: string | null
          status: string
        }
        Insert: {
          backup_type: string
          created_at?: string
          created_by?: string | null
          data_snapshot?: Json
          description?: string | null
          file_size?: number
          id?: string
          name: string
          notes?: string | null
          status?: string
        }
        Update: {
          backup_type?: string
          created_at?: string
          created_by?: string | null
          data_snapshot?: Json
          description?: string | null
          file_size?: number
          id?: string
          name?: string
          notes?: string | null
          status?: string
        }
        Relationships: []
      }
      units: {
        Row: {
          code: string
          created_at: string
          description: string
          id: string
          package_quantity: number | null
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          description: string
          id?: string
          package_quantity?: number | null
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string
          id?: string
          package_quantity?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      vehicles: {
        Row: {
          active: boolean
          brand: string | null
          capacity: number | null
          created_at: string
          driver_name: string | null
          id: string
          license_plate: string
          model: string
          name: string
          notes: string | null
          plate_number: string
          type: string
          updated_at: string
          year: number | null
        }
        Insert: {
          active?: boolean
          brand?: string | null
          capacity?: number | null
          created_at?: string
          driver_name?: string | null
          id?: string
          license_plate: string
          model: string
          name: string
          notes?: string | null
          plate_number: string
          type: string
          updated_at?: string
          year?: number | null
        }
        Update: {
          active?: boolean
          brand?: string | null
          capacity?: number | null
          created_at?: string
          driver_name?: string | null
          id?: string
          license_plate?: string
          model?: string
          name?: string
          notes?: string | null
          plate_number?: string
          type?: string
          updated_at?: string
          year?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_next_customer_code: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      get_next_load_code: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      get_next_order_code: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      get_next_product_code: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      get_next_sales_rep_code: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      get_route_with_customers: {
        Args: { p_route_id: string }
        Returns: {
          route_id: string
          route_name: string
          route_description: string
          route_status: string
          route_date: string
          route_sales_rep_id: string
          route_sales_rep_name: string
          route_vehicle_id: string
          route_vehicle_name: string
          route_last_updated: string
          customer_id: string
          customer_name: string
          customer_code: number
          customer_address: string
          customer_city: string
          customer_state: string
          customer_zip_code: string
          customer_phone: string
        }[]
      }
      hash_password: {
        Args: { password: string }
        Returns: string
      }
      sync_customers_to_route: {
        Args: { p_route_id: string; p_sales_rep_id: string }
        Returns: number
      }
      verify_password: {
        Args: { password: string; hash: string }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
