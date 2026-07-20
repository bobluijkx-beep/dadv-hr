export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      absence_records: {
        Row: {
          created_at: string
          employee_id: string
          first_sick_day: string
          id: string
          incapacity_percentage: number | null
          is_full_time_absence: boolean
          notes: string | null
          recovery_date: string | null
          status: Database["public"]["Enums"]["absence_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          employee_id: string
          first_sick_day: string
          id?: string
          incapacity_percentage?: number | null
          is_full_time_absence?: boolean
          notes?: string | null
          recovery_date?: string | null
          status?: Database["public"]["Enums"]["absence_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          employee_id?: string
          first_sick_day?: string
          id?: string
          incapacity_percentage?: number | null
          is_full_time_absence?: boolean
          notes?: string | null
          recovery_date?: string | null
          status?: Database["public"]["Enums"]["absence_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "absence_records_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          action: Database["public"]["Enums"]["audit_action"]
          changed_at: string
          changed_by: string | null
          id: string
          module: string
          new_data: Json | null
          old_data: Json | null
          organization_id: string | null
          record_id: string
          table_name: string
        }
        Insert: {
          action: Database["public"]["Enums"]["audit_action"]
          changed_at?: string
          changed_by?: string | null
          id?: string
          module: string
          new_data?: Json | null
          old_data?: Json | null
          organization_id?: string | null
          record_id: string
          table_name: string
        }
        Update: {
          action?: Database["public"]["Enums"]["audit_action"]
          changed_at?: string
          changed_by?: string | null
          id?: string
          module?: string
          new_data?: Json | null
          old_data?: Json | null
          organization_id?: string | null
          record_id?: string
          table_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_log_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      break_rules: {
        Row: {
          created_at: string
          deduction_minutes: number
          id: string
          min_hours: number
          organization_id: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          deduction_minutes: number
          id?: string
          min_hours: number
          organization_id: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          deduction_minutes?: number
          id?: string
          min_hours?: number
          organization_id?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "break_rules_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_compensation: {
        Row: {
          contract_id: string
          created_at: string
          salary_amount: number
          salary_scale: string | null
          updated_at: string
        }
        Insert: {
          contract_id: string
          created_at?: string
          salary_amount: number
          salary_scale?: string | null
          updated_at?: string
        }
        Update: {
          contract_id?: string
          created_at?: string
          salary_amount?: number
          salary_scale?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contract_compensation_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: true
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      contracts: {
        Row: {
          contract_number: string
          contract_type: Database["public"]["Enums"]["contract_type"]
          created_at: string
          deleted_at: string | null
          employee_id: string
          end_date: string | null
          hours_per_week: number
          id: string
          notes: string | null
          start_date: string
          updated_at: string
        }
        Insert: {
          contract_number: string
          contract_type: Database["public"]["Enums"]["contract_type"]
          created_at?: string
          deleted_at?: string | null
          employee_id: string
          end_date?: string | null
          hours_per_week: number
          id?: string
          notes?: string | null
          start_date: string
          updated_at?: string
        }
        Update: {
          contract_number?: string
          contract_type?: Database["public"]["Enums"]["contract_type"]
          created_at?: string
          deleted_at?: string | null
          employee_id?: string
          end_date?: string | null
          hours_per_week?: number
          id?: string
          notes?: string | null
          start_date?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contracts_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      departments: {
        Row: {
          created_at: string
          deleted_at: string | null
          id: string
          name: string
          organization_id: string
          parent_department_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          name: string
          organization_id: string
          parent_department_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          name?: string
          organization_id?: string
          parent_department_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "departments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "departments_parent_department_id_fkey"
            columns: ["parent_department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      document_versions: {
        Row: {
          document_id: string
          file_name: string
          id: string
          storage_path: string
          uploaded_at: string
          uploaded_by: string | null
          version_number: number
        }
        Insert: {
          document_id: string
          file_name: string
          id?: string
          storage_path: string
          uploaded_at?: string
          uploaded_by?: string | null
          version_number: number
        }
        Update: {
          document_id?: string
          file_name?: string
          id?: string
          storage_path?: string
          uploaded_at?: string
          uploaded_by?: string | null
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "document_versions_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_versions_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          category: Database["public"]["Enums"]["document_category"]
          created_at: string
          created_by: string | null
          current_version_id: string | null
          deleted_at: string | null
          employee_id: string
          id: string
          updated_at: string
        }
        Insert: {
          category: Database["public"]["Enums"]["document_category"]
          created_at?: string
          created_by?: string | null
          current_version_id?: string | null
          deleted_at?: string | null
          employee_id: string
          id?: string
          updated_at?: string
        }
        Update: {
          category?: Database["public"]["Enums"]["document_category"]
          created_at?: string
          created_by?: string | null
          current_version_id?: string | null
          deleted_at?: string | null
          employee_id?: string
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_current_version_id_fkey"
            columns: ["current_version_id"]
            isOneToOne: false
            referencedRelation: "document_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_addresses: {
        Row: {
          city: string
          created_at: string
          employee_id: string
          id: string
          postal_code: string
          street: string
          valid_from: string
          valid_to: string | null
        }
        Insert: {
          city: string
          created_at?: string
          employee_id: string
          id?: string
          postal_code: string
          street: string
          valid_from?: string
          valid_to?: string | null
        }
        Update: {
          city?: string
          created_at?: string
          employee_id?: string
          id?: string
          postal_code?: string
          street?: string
          valid_from?: string
          valid_to?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_addresses_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_children: {
        Row: {
          created_at: string
          date_of_birth: string | null
          employee_id: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          date_of_birth?: string | null
          employee_id: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          date_of_birth?: string | null
          employee_id?: string
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_children_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_contact_details: {
        Row: {
          created_at: string
          email: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          employee_id: string
          id: string
          phone: string | null
          valid_from: string
          valid_to: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          employee_id: string
          id?: string
          phone?: string | null
          valid_from?: string
          valid_to?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          employee_id?: string
          id?: string
          phone?: string | null
          valid_from?: string
          valid_to?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_contact_details_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_private_details: {
        Row: {
          created_at: string
          employee_id: string
          hobbies: string | null
          interests: string | null
          notes: string | null
          partner_date_of_birth: string | null
          partner_name: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          employee_id: string
          hobbies?: string | null
          interests?: string | null
          notes?: string | null
          partner_date_of_birth?: string | null
          partner_name?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          employee_id?: string
          hobbies?: string | null
          interests?: string | null
          notes?: string | null
          partner_date_of_birth?: string | null
          partner_name?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_private_details_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: true
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          bsn_encrypted: string | null
          created_at: string
          date_of_birth: string | null
          deleted_at: string | null
          department_id: string | null
          employee_number: string
          employment_end_date: string | null
          employment_start_date: string | null
          first_name: string
          gender: Database["public"]["Enums"]["gender_type"]
          iban: string | null
          id: string
          insertion: string | null
          is_active: boolean
          job_title: string | null
          last_name: string
          manager_id: string | null
          organization_id: string
          preferred_name: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          bsn_encrypted?: string | null
          created_at?: string
          date_of_birth?: string | null
          deleted_at?: string | null
          department_id?: string | null
          employee_number: string
          employment_end_date?: string | null
          employment_start_date?: string | null
          first_name: string
          gender?: Database["public"]["Enums"]["gender_type"]
          iban?: string | null
          id?: string
          insertion?: string | null
          is_active?: boolean
          job_title?: string | null
          last_name: string
          manager_id?: string | null
          organization_id: string
          preferred_name?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          bsn_encrypted?: string | null
          created_at?: string
          date_of_birth?: string | null
          deleted_at?: string | null
          department_id?: string | null
          employee_number?: string
          employment_end_date?: string | null
          employment_start_date?: string | null
          first_name?: string
          gender?: Database["public"]["Enums"]["gender_type"]
          iban?: string | null
          id?: string
          insertion?: string | null
          is_active?: boolean
          job_title?: string | null
          last_name?: string
          manager_id?: string | null
          organization_id?: string
          preferred_name?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employees_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      expense_claims: {
        Row: {
          amount: number
          created_at: string
          description: string
          employee_id: string
          id: string
          payment_date: string | null
          receipt_storage_path: string | null
          status: Database["public"]["Enums"]["expense_status"]
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          description: string
          employee_id: string
          id?: string
          payment_date?: string | null
          receipt_storage_path?: string | null
          status?: Database["public"]["Enums"]["expense_status"]
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string
          employee_id?: string
          id?: string
          payment_date?: string | null
          receipt_storage_path?: string | null
          status?: Database["public"]["Enums"]["expense_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "expense_claims_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_mappings: {
        Row: {
          created_at: string
          external_id: string
          id: string
          local_id: string
          local_table: string
          system: string
        }
        Insert: {
          created_at?: string
          external_id: string
          id?: string
          local_id: string
          local_table: string
          system?: string
        }
        Update: {
          created_at?: string
          external_id?: string
          id?: string
          local_id?: string
          local_table?: string
          system?: string
        }
        Relationships: []
      }
      integration_sync_log: {
        Row: {
          direction: Database["public"]["Enums"]["integration_direction"]
          entity: string
          id: string
          payload: Json | null
          status: Database["public"]["Enums"]["integration_sync_status"]
          synced_at: string
          system: string
        }
        Insert: {
          direction: Database["public"]["Enums"]["integration_direction"]
          entity: string
          id?: string
          payload?: Json | null
          status?: Database["public"]["Enums"]["integration_sync_status"]
          synced_at?: string
          system?: string
        }
        Update: {
          direction?: Database["public"]["Enums"]["integration_direction"]
          entity?: string
          id?: string
          payload?: Json | null
          status?: Database["public"]["Enums"]["integration_sync_status"]
          synced_at?: string
          system?: string
        }
        Relationships: []
      }
      leave_balances: {
        Row: {
          accrued_hours: number
          employee_id: string
          id: string
          leave_type_id: string
          remaining_hours: number | null
          taken_hours: number
          updated_at: string
          year: number
        }
        Insert: {
          accrued_hours?: number
          employee_id: string
          id?: string
          leave_type_id: string
          remaining_hours?: number | null
          taken_hours?: number
          updated_at?: string
          year: number
        }
        Update: {
          accrued_hours?: number
          employee_id?: string
          id?: string
          leave_type_id?: string
          remaining_hours?: number | null
          taken_hours?: number
          updated_at?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "leave_balances_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_balances_leave_type_id_fkey"
            columns: ["leave_type_id"]
            isOneToOne: false
            referencedRelation: "leave_types"
            referencedColumns: ["id"]
          },
        ]
      }
      leave_requests: {
        Row: {
          approver_id: string | null
          employee_id: string
          end_date: string
          hours: number
          id: string
          leave_type_id: string
          requested_at: string
          start_date: string
          status: Database["public"]["Enums"]["leave_request_status"]
          updated_at: string
        }
        Insert: {
          approver_id?: string | null
          employee_id: string
          end_date: string
          hours: number
          id?: string
          leave_type_id: string
          requested_at?: string
          start_date: string
          status?: Database["public"]["Enums"]["leave_request_status"]
          updated_at?: string
        }
        Update: {
          approver_id?: string | null
          employee_id?: string
          end_date?: string
          hours?: number
          id?: string
          leave_type_id?: string
          requested_at?: string
          start_date?: string
          status?: Database["public"]["Enums"]["leave_request_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leave_requests_approver_id_fkey"
            columns: ["approver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_requests_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_requests_leave_type_id_fkey"
            columns: ["leave_type_id"]
            isOneToOne: false
            referencedRelation: "leave_types"
            referencedColumns: ["id"]
          },
        ]
      }
      leave_transactions: {
        Row: {
          created_at: string
          employee_id: string
          hours: number
          id: string
          leave_request_id: string | null
          leave_type_id: string
          transaction_date: string
          transaction_type: Database["public"]["Enums"]["leave_transaction_type"]
        }
        Insert: {
          created_at?: string
          employee_id: string
          hours: number
          id?: string
          leave_request_id?: string | null
          leave_type_id: string
          transaction_date?: string
          transaction_type: Database["public"]["Enums"]["leave_transaction_type"]
        }
        Update: {
          created_at?: string
          employee_id?: string
          hours?: number
          id?: string
          leave_request_id?: string | null
          leave_type_id?: string
          transaction_date?: string
          transaction_type?: Database["public"]["Enums"]["leave_transaction_type"]
        }
        Relationships: [
          {
            foreignKeyName: "leave_transactions_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_transactions_leave_request_id_fkey"
            columns: ["leave_request_id"]
            isOneToOne: false
            referencedRelation: "leave_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_transactions_leave_type_id_fkey"
            columns: ["leave_type_id"]
            isOneToOne: false
            referencedRelation: "leave_types"
            referencedColumns: ["id"]
          },
        ]
      }
      leave_types: {
        Row: {
          accrual_factor: number
          created_at: string
          id: string
          is_statutory: boolean
          name: string
          organization_id: string
          updated_at: string
        }
        Insert: {
          accrual_factor: number
          created_at?: string
          id?: string
          is_statutory?: boolean
          name: string
          organization_id: string
          updated_at?: string
        }
        Update: {
          accrual_factor?: number
          created_at?: string
          id?: string
          is_statutory?: boolean
          name?: string
          organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leave_types_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_log: {
        Row: {
          id: string
          recipient_email: string
          related_id: string | null
          related_table: string | null
          resend_message_id: string | null
          sent_at: string
          status: Database["public"]["Enums"]["notification_status"]
          type: Database["public"]["Enums"]["notification_type"]
        }
        Insert: {
          id?: string
          recipient_email: string
          related_id?: string | null
          related_table?: string | null
          resend_message_id?: string | null
          sent_at?: string
          status?: Database["public"]["Enums"]["notification_status"]
          type: Database["public"]["Enums"]["notification_type"]
        }
        Update: {
          id?: string
          recipient_email?: string
          related_id?: string | null
          related_table?: string | null
          resend_message_id?: string | null
          sent_at?: string
          status?: Database["public"]["Enums"]["notification_status"]
          type?: Database["public"]["Enums"]["notification_type"]
        }
        Relationships: []
      }
      org_settings: {
        Row: {
          category: string
          created_at: string
          id: string
          key: string
          organization_id: string
          updated_at: string
          value: Json
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          key: string
          organization_id: string
          updated_at?: string
          value: Json
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          key?: string
          organization_id?: string
          updated_at?: string
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "org_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          address: string | null
          created_at: string
          deleted_at: string | null
          id: string
          kvk_number: string | null
          name: string
          settings: Json
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          deleted_at?: string | null
          id?: string
          kvk_number?: string | null
          name: string
          settings?: Json
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          deleted_at?: string | null
          id?: string
          kvk_number?: string | null
          name?: string
          settings?: Json
          updated_at?: string
        }
        Relationships: []
      }
      overtime_entries: {
        Row: {
          approved_by: string | null
          contract_hours: number
          created_at: string
          employee_id: string
          id: string
          notes: string | null
          overtime_hours: number | null
          payout_percentage: number | null
          period_end: string
          period_start: string
          status: Database["public"]["Enums"]["overtime_status"]
          updated_at: string
          worked_hours: number
        }
        Insert: {
          approved_by?: string | null
          contract_hours: number
          created_at?: string
          employee_id: string
          id?: string
          notes?: string | null
          overtime_hours?: number | null
          payout_percentage?: number | null
          period_end: string
          period_start: string
          status?: Database["public"]["Enums"]["overtime_status"]
          updated_at?: string
          worked_hours: number
        }
        Update: {
          approved_by?: string | null
          contract_hours?: number
          created_at?: string
          employee_id?: string
          id?: string
          notes?: string | null
          overtime_hours?: number | null
          payout_percentage?: number | null
          period_end?: string
          period_start?: string
          status?: Database["public"]["Enums"]["overtime_status"]
          updated_at?: string
          worked_hours?: number
        }
        Relationships: [
          {
            foreignKeyName: "overtime_entries_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "overtime_entries_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          employee_id: string | null
          id: string
          is_active: boolean
          organization_id: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          employee_id?: string | null
          id: string
          is_active?: boolean
          organization_id: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          employee_id?: string | null
          id?: string
          is_active?: boolean
          organization_id?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      salary_history: {
        Row: {
          absolute_difference: number | null
          change_date: string
          changed_by: string | null
          created_at: string
          employee_id: string
          id: string
          new_salary: number
          old_salary: number | null
          percentage_increase: number | null
          reason: string | null
        }
        Insert: {
          absolute_difference?: number | null
          change_date?: string
          changed_by?: string | null
          created_at?: string
          employee_id: string
          id?: string
          new_salary: number
          old_salary?: number | null
          percentage_increase?: number | null
          reason?: string | null
        }
        Update: {
          absolute_difference?: number | null
          change_date?: string
          changed_by?: string | null
          created_at?: string
          employee_id?: string
          id?: string
          new_salary?: number
          old_salary?: number | null
          percentage_increase?: number | null
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "salary_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "salary_history_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      schedule_days: {
        Row: {
          computed_hours: number | null
          created_at: string
          end_time: string
          id: string
          schedule_period_id: string
          start_time: string
          weekday: number
        }
        Insert: {
          computed_hours?: number | null
          created_at?: string
          end_time: string
          id?: string
          schedule_period_id: string
          start_time: string
          weekday: number
        }
        Update: {
          computed_hours?: number | null
          created_at?: string
          end_time?: string
          id?: string
          schedule_period_id?: string
          start_time?: string
          weekday?: number
        }
        Relationships: [
          {
            foreignKeyName: "schedule_days_schedule_period_id_fkey"
            columns: ["schedule_period_id"]
            isOneToOne: false
            referencedRelation: "schedule_periods"
            referencedColumns: ["id"]
          },
        ]
      }
      schedule_periods: {
        Row: {
          created_at: string
          employee_id: string
          end_date: string | null
          id: string
          start_date: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          employee_id: string
          end_date?: string | null
          id?: string
          start_date: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          employee_id?: string
          end_date?: string | null
          id?: string
          start_date?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "schedule_periods_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      absence_status_view: {
        Row: {
          employee_id: string | null
          first_sick_day: string | null
          id: string | null
          is_full_time_absence: boolean | null
          recovery_date: string | null
          status: Database["public"]["Enums"]["absence_status"] | null
        }
        Insert: {
          employee_id?: string | null
          first_sick_day?: string | null
          id?: string | null
          is_full_time_absence?: boolean | null
          recovery_date?: string | null
          status?: Database["public"]["Enums"]["absence_status"] | null
        }
        Update: {
          employee_id?: string | null
          first_sick_day?: string | null
          id?: string | null
          is_full_time_absence?: boolean | null
          recovery_date?: string | null
          status?: Database["public"]["Enums"]["absence_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "absence_records_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      auth_employee_id: { Args: never; Returns: string }
      auth_organization_id: { Args: never; Returns: string }
      auth_profile: {
        Args: never
        Returns: {
          created_at: string
          employee_id: string | null
          id: string
          is_active: boolean
          organization_id: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "profiles"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      auth_role: {
        Args: never
        Returns: Database["public"]["Enums"]["user_role"]
      }
      decrypt_bsn: { Args: { bsn_encrypted: string }; Returns: string }
      encrypt_bsn: { Args: { bsn: string }; Returns: string }
      get_bsn_encryption_key: { Args: never; Returns: string }
      is_manager_of: { Args: { target_employee_id: string }; Returns: boolean }
      purge_soft_deleted: { Args: { p_table_name: string }; Returns: number }
      set_employee_bsn: {
        Args: { p_bsn: string; p_employee_id: string }
        Returns: undefined
      }
    }
    Enums: {
      absence_status: "actief" | "hersteld" | "gedeeltelijk_hersteld"
      audit_action: "insert" | "update" | "delete"
      contract_type:
        | "bepaalde_tijd"
        | "onbepaalde_tijd"
        | "oproep"
        | "stage"
        | "overig"
      document_category:
        | "arbeidsovereenkomst"
        | "addendum"
        | "id_document"
        | "certificaat"
        | "functioneringsgesprek"
        | "beoordelingsgesprek"
        | "verzuimdocument"
        | "overig"
      expense_status: "ingediend" | "goedgekeurd" | "afgewezen" | "betaald"
      gender_type: "man" | "vrouw" | "anders" | "onbekend"
      integration_direction: "inbound" | "outbound"
      integration_sync_status: "success" | "failed" | "pending"
      leave_request_status:
        | "aangevraagd"
        | "goedgekeurd"
        | "afgewezen"
        | "ingetrokken"
      leave_transaction_type: "opbouw" | "opname" | "correctie" | "jaarovergang"
      notification_status: "verzonden" | "mislukt"
      notification_type:
        | "verlof_aangevraagd"
        | "verlof_goedgekeurd"
        | "verlof_afgewezen"
        | "overuren_ingediend"
        | "overuren_goedgekeurd"
        | "overuren_aangeboden"
        | "overuren_verwerkt"
      overtime_status:
        | "geregistreerd"
        | "goedgekeurd"
        | "aangeboden_salarisadministratie"
        | "verwerkt"
        | "uitbetaald"
        | "tijd_voor_tijd"
      user_role: "admin" | "hr" | "manager" | "employee"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      absence_status: ["actief", "hersteld", "gedeeltelijk_hersteld"],
      audit_action: ["insert", "update", "delete"],
      contract_type: [
        "bepaalde_tijd",
        "onbepaalde_tijd",
        "oproep",
        "stage",
        "overig",
      ],
      document_category: [
        "arbeidsovereenkomst",
        "addendum",
        "id_document",
        "certificaat",
        "functioneringsgesprek",
        "beoordelingsgesprek",
        "verzuimdocument",
        "overig",
      ],
      expense_status: ["ingediend", "goedgekeurd", "afgewezen", "betaald"],
      gender_type: ["man", "vrouw", "anders", "onbekend"],
      integration_direction: ["inbound", "outbound"],
      integration_sync_status: ["success", "failed", "pending"],
      leave_request_status: [
        "aangevraagd",
        "goedgekeurd",
        "afgewezen",
        "ingetrokken",
      ],
      leave_transaction_type: ["opbouw", "opname", "correctie", "jaarovergang"],
      notification_status: ["verzonden", "mislukt"],
      notification_type: [
        "verlof_aangevraagd",
        "verlof_goedgekeurd",
        "verlof_afgewezen",
        "overuren_ingediend",
        "overuren_goedgekeurd",
        "overuren_aangeboden",
        "overuren_verwerkt",
      ],
      overtime_status: [
        "geregistreerd",
        "goedgekeurd",
        "aangeboden_salarisadministratie",
        "verwerkt",
        "uitbetaald",
        "tijd_voor_tijd",
      ],
      user_role: ["admin", "hr", "manager", "employee"],
    },
  },
} as const
