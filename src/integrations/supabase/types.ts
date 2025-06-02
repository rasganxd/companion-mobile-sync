export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      api_tokens: {
        Row: {
          created_at: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          last_used_at: string | null
          name: string
          permissions: Json | null
          sales_rep_id: string | null
          token: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          last_used_at?: string | null
          name: string
          permissions?: Json | null
          sales_rep_id?: string | null
          token: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          last_used_at?: string | null
          name?: string
          permissions?: Json | null
          sales_rep_id?: string | null
          token?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "api_tokens_sales_rep_id_fkey"
            columns: ["sales_rep_id"]
            isOneToOne: false
            referencedRelation: "sales_reps"
            referencedColumns: ["id"]
          },
        ]
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
          id: string
          notes: string | null
          sales_rep_id: string | null
          status: string
          total_value: number | null
          updated_at: string
          vehicle_id: string | null
        }
        Insert: {
          code?: number
          created_at?: string
          date?: string
          id?: string
          notes?: string | null
          sales_rep_id?: string | null
          status?: string
          total_value?: number | null
          updated_at?: string
          vehicle_id?: string | null
        }
        Update: {
          code?: number
          created_at?: string
          date?: string
          id?: string
          notes?: string | null
          sales_rep_id?: string | null
          status?: string
          total_value?: number | null
          updated_at?: string
          vehicle_id?: string | null
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
      order_items_mobile: {
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
            foreignKeyName: "order_items_mobile_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders_mobile"
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
          imported: boolean | null
          mobile_order_id: string | null
          notes: string | null
          payment_method: string | null
          payment_method_id: string | null
          payment_status: string | null
          payment_table: string | null
          payment_table_id: string | null
          payments: Json | null
          sales_rep_id: string | null
          sales_rep_name: string | null
          source_project: string
          status: string
          sync_status: string | null
          total: number
          updated_at: string
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
          imported?: boolean | null
          mobile_order_id?: string | null
          notes?: string | null
          payment_method?: string | null
          payment_method_id?: string | null
          payment_status?: string | null
          payment_table?: string | null
          payment_table_id?: string | null
          payments?: Json | null
          sales_rep_id?: string | null
          sales_rep_name?: string | null
          source_project?: string
          status?: string
          sync_status?: string | null
          total?: number
          updated_at?: string
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
          imported?: boolean | null
          mobile_order_id?: string | null
          notes?: string | null
          payment_method?: string | null
          payment_method_id?: string | null
          payment_status?: string | null
          payment_table?: string | null
          payment_table_id?: string | null
          payments?: Json | null
          sales_rep_id?: string | null
          sales_rep_name?: string | null
          source_project?: string
          status?: string
          sync_status?: string | null
          total?: number
          updated_at?: string
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
      orders_mobile: {
        Row: {
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
          imported: boolean
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
          sales_rep_id: string | null
          sales_rep_name: string | null
          source_project: string
          status: string
          sync_status: string | null
          total: number
          updated_at: string
        }
        Insert: {
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
          imported?: boolean
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
          sales_rep_id?: string | null
          sales_rep_name?: string | null
          source_project?: string
          status?: string
          sync_status?: string | null
          total?: number
          updated_at?: string
        }
        Update: {
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
          imported?: boolean
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
          sales_rep_id?: string | null
          sales_rep_name?: string | null
          source_project?: string
          status?: string
          sync_status?: string | null
          total?: number
          updated_at?: string
        }
        Relationships: []
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
      sync_logs: {
        Row: {
          created_at: string
          data_type: string | null
          device_id: string | null
          device_ip: string | null
          error_message: string | null
          event_type: string
          id: string
          metadata: Json | null
          records_count: number | null
          sales_rep_id: string | null
          status: string
          sync_token_id: string | null
        }
        Insert: {
          created_at?: string
          data_type?: string | null
          device_id?: string | null
          device_ip?: string | null
          error_message?: string | null
          event_type: string
          id?: string
          metadata?: Json | null
          records_count?: number | null
          sales_rep_id?: string | null
          status: string
          sync_token_id?: string | null
        }
        Update: {
          created_at?: string
          data_type?: string | null
          device_id?: string | null
          device_ip?: string | null
          error_message?: string | null
          event_type?: string
          id?: string
          metadata?: Json | null
          records_count?: number | null
          sales_rep_id?: string | null
          status?: string
          sync_token_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sync_logs_sales_rep_id_fkey"
            columns: ["sales_rep_id"]
            isOneToOne: false
            referencedRelation: "sales_reps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sync_logs_sync_token_id_fkey"
            columns: ["sync_token_id"]
            isOneToOne: false
            referencedRelation: "sync_tokens"
            referencedColumns: ["id"]
          },
        ]
      }
      sync_settings: {
        Row: {
          allowed_data_types: string[]
          auto_sync_enabled: boolean
          created_at: string
          id: string
          max_offline_days: number
          require_admin_approval: boolean
          sync_interval_minutes: number
          updated_at: string
        }
        Insert: {
          allowed_data_types?: string[]
          auto_sync_enabled?: boolean
          created_at?: string
          id?: string
          max_offline_days?: number
          require_admin_approval?: boolean
          sync_interval_minutes?: number
          updated_at?: string
        }
        Update: {
          allowed_data_types?: string[]
          auto_sync_enabled?: boolean
          created_at?: string
          id?: string
          max_offline_days?: number
          require_admin_approval?: boolean
          sync_interval_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      sync_tokens: {
        Row: {
          active: boolean
          created_at: string
          device_id: string | null
          device_ip: string | null
          expires_at: string
          id: string
          project_type: string
          sales_rep_id: string | null
          token: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          device_id?: string | null
          device_ip?: string | null
          expires_at: string
          id?: string
          project_type: string
          sales_rep_id?: string | null
          token: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          device_id?: string | null
          device_ip?: string | null
          expires_at?: string
          id?: string
          project_type?: string
          sales_rep_id?: string | null
          token?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sync_tokens_sales_rep_id_fkey"
            columns: ["sales_rep_id"]
            isOneToOne: false
            referencedRelation: "sales_reps"
            referencedColumns: ["id"]
          },
        ]
      }
      sync_updates: {
        Row: {
          completed_at: string | null
          created_at: string
          created_by_user: string | null
          data_types: string[]
          description: string | null
          id: string
          is_active: boolean
          metadata: Json | null
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          created_by_user?: string | null
          data_types?: string[]
          description?: string | null
          id?: string
          is_active?: boolean
          metadata?: Json | null
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          created_by_user?: string | null
          data_types?: string[]
          description?: string | null
          id?: string
          is_active?: boolean
          metadata?: Json | null
          updated_at?: string
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
      cleanup_expired_tokens: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      generate_api_token: {
        Args: {
          p_sales_rep_id: string
          p_name: string
          p_expires_days?: number
        }
        Returns: string
      }
      generate_sync_token: {
        Args: {
          p_sales_rep_id: string
          p_project_type?: string
          p_device_id?: string
          p_device_ip?: string
          p_expires_minutes?: number
        }
        Returns: {
          token: string
          expires_at: string
        }[]
      }
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
      import_mobile_orders: {
        Args: { p_sales_rep_id?: string; p_imported_by?: string }
        Returns: {
          imported_count: number
          failed_count: number
          error_messages: string[]
        }[]
      }
      sync_customers_to_route: {
        Args: { p_route_id: string; p_sales_rep_id: string }
        Returns: number
      }
      validate_api_token: {
        Args: { token_value: string }
        Returns: string
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
