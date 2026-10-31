
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "graphql_public": {
          Tables: {
            [_ in never]: never
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "graphql":
{ Args: { "extensions"?: Json,"operationName"?: string,"query"?: string,"variables"?: Json }; Returns: Json
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        },"public": {
          Tables: {
            "addresses": {
                  Row: {
                    "city": string | null,"country": string | null,"county": string | null,"created_at": string,"id": string,"input": string | null,"place_id": string | null,"postal_code": string | null,"precision": string,"state": string | null,"street": string | null,"unit": string | null,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "city"?: string | null,"country"?: string | null,"county"?: string | null,"created_at"?: string,"id"?: string,"input"?: string | null,"place_id"?: string | null,"postal_code"?: string | null,"precision"?: string,"state"?: string | null,"street"?: string | null,"unit"?: string | null,"updated_at"?: string
                  }
                  Update: {
                    "city"?: string | null,"country"?: string | null,"county"?: string | null,"created_at"?: string,"id"?: string,"input"?: string | null,"place_id"?: string | null,"postal_code"?: string | null,"precision"?: string,"state"?: string | null,"street"?: string | null,"unit"?: string | null,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"attachments": {
                  Row: {
                    "byte_size": number,"created_at": string,"file_name": string,"id": string,"mime_type": string,"object_path": string,"request_id": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "byte_size": number,"created_at"?: string,"file_name": string,"id"?: string,"mime_type": string,"object_path": string,"request_id": string,"updated_at"?: string
                  }
                  Update: {
                    "byte_size"?: number,"created_at"?: string,"file_name"?: string,"id"?: string,"mime_type"?: string,"object_path"?: string,"request_id"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "attachments_request_id_fkey"
      columns: ["request_id"]
isOneToOne: false
      referencedRelation: "moving_requests"
      referencedColumns: ["id"]
    }
                  ]
                },"customers": {
                  Row: {
                    "created_at": string,"email": string | null,"first_name": string | null,"full_name": string | null,"id": string,"last_name": string | null,"phone": string,"updated_at": string,"version": number
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"email"?: string | null,"first_name"?: string | null,"full_name"?: string | null,"id"?: string,"last_name"?: string | null,"phone": string,"updated_at"?: string,"version"?: number
                  }
                  Update: {
                    "created_at"?: string,"email"?: string | null,"first_name"?: string | null,"full_name"?: string | null,"id"?: string,"last_name"?: string | null,"phone"?: string,"updated_at"?: string,"version"?: number
                  }
                  Relationships: [
                    
                  ]
                },"moves": {
                  Row: {
                    "actual_miles": number | null,"cancellation_reason": string | null,"cancelled_at": string | null,"created_at": string,"customer_id": string,"destination_id": string,"estimated_duration_minutes": number | null,"final_total_cents": number | null,"finished_at": string | null,"id": string,"notes": string,"origin_id": string,"request_id": string,"revised_total_cents": number | null,"scheduled_at": string,"started_at": string | null,"status": string,"updated_at": string,"version": number
                  }
                  ComputedFields: never
                  Insert: {
                    "actual_miles"?: number | null,"cancellation_reason"?: string | null,"cancelled_at"?: string | null,"created_at"?: string,"customer_id": string,"destination_id": string,"estimated_duration_minutes"?: number | null,"final_total_cents"?: number | null,"finished_at"?: string | null,"id"?: string,"notes"?: string,"origin_id": string,"request_id": string,"revised_total_cents"?: number | null,"scheduled_at": string,"started_at"?: string | null,"status"?: string,"updated_at"?: string,"version"?: number
                  }
                  Update: {
                    "actual_miles"?: number | null,"cancellation_reason"?: string | null,"cancelled_at"?: string | null,"created_at"?: string,"customer_id"?: string,"destination_id"?: string,"estimated_duration_minutes"?: number | null,"final_total_cents"?: number | null,"finished_at"?: string | null,"id"?: string,"notes"?: string,"origin_id"?: string,"request_id"?: string,"revised_total_cents"?: number | null,"scheduled_at"?: string,"started_at"?: string | null,"status"?: string,"updated_at"?: string,"version"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "moves_customer_id_fkey"
      columns: ["customer_id"]
isOneToOne: false
      referencedRelation: "customers"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "moves_destination_id_fkey"
      columns: ["destination_id"]
isOneToOne: false
      referencedRelation: "addresses"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "moves_origin_id_fkey"
      columns: ["origin_id"]
isOneToOne: false
      referencedRelation: "addresses"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "moves_request_id_fkey"
      columns: ["request_id"]
isOneToOne: true
      referencedRelation: "moving_requests"
      referencedColumns: ["id"]
    }
                  ]
                },"moving_requests": {
                  Row: {
                    "bedrooms": number | null,"cancellation_reason": string | null,"cancelled_at": string | null,"comments": string,"created_at": string,"customer_id": string,"destination_elevator": boolean | null,"destination_floor": number | null,"destination_id": string,"email": string | null,"first_name": string | null,"full_name": string | null,"id": string,"intake_version": number,"last_name": string | null,"move_size": string | null,"moving_date": string | null,"origin_elevator": boolean | null,"origin_floor": number | null,"origin_id": string,"phone": string,"property_size": number | null,"property_type": string | null,"request_number": string,"size_unit": string | null,"status": string,"suggested_mode": string | null,"territorial_reviewed": boolean,"territorial_source": string,"updated_at": string,"version": number,"workers": number | null
                  }
                  ComputedFields: never
                  Insert: {
                    "bedrooms"?: number | null,"cancellation_reason"?: string | null,"cancelled_at"?: string | null,"comments"?: string,"created_at"?: string,"customer_id": string,"destination_elevator"?: boolean | null,"destination_floor"?: number | null,"destination_id": string,"email"?: string | null,"first_name"?: string | null,"full_name"?: string | null,"id"?: string,"intake_version"?: number,"last_name"?: string | null,"move_size"?: string | null,"moving_date"?: string | null,"origin_elevator"?: boolean | null,"origin_floor"?: number | null,"origin_id": string,"phone": string,"property_size"?: number | null,"property_type"?: string | null,"request_number"?: string,"size_unit"?: string | null,"status"?: string,"suggested_mode"?: string | null,"territorial_reviewed"?: boolean,"territorial_source"?: string,"updated_at"?: string,"version"?: number,"workers"?: number | null
                  }
                  Update: {
                    "bedrooms"?: number | null,"cancellation_reason"?: string | null,"cancelled_at"?: string | null,"comments"?: string,"created_at"?: string,"customer_id"?: string,"destination_elevator"?: boolean | null,"destination_floor"?: number | null,"destination_id"?: string,"email"?: string | null,"first_name"?: string | null,"full_name"?: string | null,"id"?: string,"intake_version"?: number,"last_name"?: string | null,"move_size"?: string | null,"moving_date"?: string | null,"origin_elevator"?: boolean | null,"origin_floor"?: number | null,"origin_id"?: string,"phone"?: string,"property_size"?: number | null,"property_type"?: string | null,"request_number"?: string,"size_unit"?: string | null,"status"?: string,"suggested_mode"?: string | null,"territorial_reviewed"?: boolean,"territorial_source"?: string,"updated_at"?: string,"version"?: number,"workers"?: number | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "moving_requests_customer_id_fkey"
      columns: ["customer_id"]
isOneToOne: false
      referencedRelation: "customers"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "moving_requests_destination_id_fkey"
      columns: ["destination_id"]
isOneToOne: true
      referencedRelation: "addresses"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "moving_requests_origin_id_fkey"
      columns: ["origin_id"]
isOneToOne: true
      referencedRelation: "addresses"
      referencedColumns: ["id"]
    }
                  ]
                },"notes": {
                  Row: {
                    "author_id": string,"body": string,"created_at": string,"id": string,"request_id": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "author_id": string,"body": string,"created_at"?: string,"id"?: string,"request_id": string,"updated_at"?: string
                  }
                  Update: {
                    "author_id"?: string,"body"?: string,"created_at"?: string,"id"?: string,"request_id"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "notes_author_id_fkey"
      columns: ["author_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "notes_request_id_fkey"
      columns: ["request_id"]
isOneToOne: false
      referencedRelation: "moving_requests"
      referencedColumns: ["id"]
    }
                  ]
                },"pricing_change_history": {
                  Row: {
                    "actor_id": string | null,"created_at": string,"entity_id": string,"entity_type": string,"field": string,"id": string,"new_value": Json | null,"old_value": Json | null,"request_id": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "actor_id"?: string | null,"created_at"?: string,"entity_id": string,"entity_type": string,"field": string,"id"?: string,"new_value"?: Json | null,"old_value"?: Json | null,"request_id"?: string | null
                  }
                  Update: {
                    "actor_id"?: string | null,"created_at"?: string,"entity_id"?: string,"entity_type"?: string,"field"?: string,"id"?: string,"new_value"?: Json | null,"old_value"?: Json | null,"request_id"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "pricing_change_history_actor_id_fkey"
      columns: ["actor_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "pricing_change_history_request_id_fkey"
      columns: ["request_id"]
isOneToOne: false
      referencedRelation: "moving_requests"
      referencedColumns: ["id"]
    }
                  ]
                },"pricing_settings": {
                  Row: {
                    "created_at": string,"hourly_four": number,"hourly_three": number,"hourly_two": number,"id": boolean,"minimum_hours": number,"per_mile": number,"updated_at": string,"version": number
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"hourly_four"?: number,"hourly_three"?: number,"hourly_two"?: number,"id"?: boolean,"minimum_hours"?: number,"per_mile"?: number,"updated_at"?: string,"version"?: number
                  }
                  Update: {
                    "created_at"?: string,"hourly_four"?: number,"hourly_three"?: number,"hourly_two"?: number,"id"?: boolean,"minimum_hours"?: number,"per_mile"?: number,"updated_at"?: string,"version"?: number
                  }
                  Relationships: [
                    
                  ]
                },"profiles": {
                  Row: {
                    "active": boolean,"created_at": string,"email": string,"full_name": string,"id": string,"role": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "active"?: boolean,"created_at"?: string,"email": string,"full_name"?: string,"id": string,"role": string,"updated_at"?: string
                  }
                  Update: {
                    "active"?: boolean,"created_at"?: string,"email"?: string,"full_name"?: string,"id"?: string,"role"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"quote_communications": {
                  Row: {
                    "actor_id": string,"communicated_at": string,"confirmed_at": string | null,"created_at": string,"id": string,"medium": string,"quote_id": string,"response": string,"terms": NonNullable<Json>,"terms_version": number,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "actor_id": string,"communicated_at": string,"confirmed_at"?: string | null,"created_at"?: string,"id"?: string,"medium": string,"quote_id": string,"response"?: string,"terms": NonNullable<Json>,"terms_version": number,"updated_at"?: string
                  }
                  Update: {
                    "actor_id"?: string,"communicated_at"?: string,"confirmed_at"?: string | null,"created_at"?: string,"id"?: string,"medium"?: string,"quote_id"?: string,"response"?: string,"terms"?: NonNullable<Json>,"terms_version"?: number,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "quote_communications_actor_id_fkey"
      columns: ["actor_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "quote_communications_quote_id_fkey"
      columns: ["quote_id"]
isOneToOne: false
      referencedRelation: "quotes"
      referencedColumns: ["id"]
    }
                  ]
                },"quotes": {
                  Row: {
                    "confirmed_terms": Json | null,"created_at": string,"estimated_quantity": number,"estimated_total_cents": number,"id": string,"minimum_hours": number,"mode": string,"rate_cents": number,"request_id": string,"status": string,"terms_version": number,"updated_at": string,"version": number,"workers": number
                  }
                  ComputedFields: never
                  Insert: {
                    "confirmed_terms"?: Json | null,"created_at"?: string,"estimated_quantity": number,"estimated_total_cents": number,"id"?: string,"minimum_hours": number,"mode": string,"rate_cents": number,"request_id": string,"status"?: string,"terms_version"?: number,"updated_at"?: string,"version"?: number,"workers": number
                  }
                  Update: {
                    "confirmed_terms"?: Json | null,"created_at"?: string,"estimated_quantity"?: number,"estimated_total_cents"?: number,"id"?: string,"minimum_hours"?: number,"mode"?: string,"rate_cents"?: number,"request_id"?: string,"status"?: string,"terms_version"?: number,"updated_at"?: string,"version"?: number,"workers"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "quotes_request_id_fkey"
      columns: ["request_id"]
isOneToOne: true
      referencedRelation: "moving_requests"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "begin_staff_email": { Args: { p_email: string; p_role: string }; Returns: Json },
            "approve_quote":
{ Args: { "p_request": string,"p_version": number }; Returns: undefined
                           },
"bootstrap_admin":
{ Args: { "p_id": string }; Returns: undefined
                           },
"communicate_quote":
{ Args: { "p_at": string,"p_confirm": boolean,"p_medium": string,"p_request": string,"p_response": string,"p_version": number }; Returns: undefined
                           },
"dashboard_metrics":
{ Args: Record<PropertyKey, never>; Returns: Json
                           },
"edit_customer":
{ Args: { "p_email": string,"p_first": string,"p_id": string,"p_last": string,"p_phone": string,"p_version": number }; Returns: undefined
                           },
"edit_customer_name":
{ Args: { "p_email": string,"p_id": string,"p_name": string,"p_phone": string,"p_version": number }; Returns: undefined
                           },
"edit_request":
{ Args: { "p_data": Json,"p_id": string,"p_version": number }; Returns: undefined
                           },
"intake_begin":
{ Args: { "p_data": Json,"p_hash": string,"p_key": string }; Returns: string
                           },
"intake_cleanup_candidates":
{ Args: Record<PropertyKey, never>; Returns: {
              "id": string,"paths": (string)[]
            }[]
                           },
"intake_cleanup_finish":
{ Args: { "p_id": string }; Returns: undefined
                           },
"intake_file":
{ Args: { "p_action": string,"p_hash": string,"p_id": string,"p_mime"?: string,"p_name"?: string,"p_size"?: number }; Returns: string
                           },
"intake_finalize":
{ Args: { "p_hash": string }; Returns: string
                           },
"intake_quota":
{ Args: { "p_key": string,"p_limit": number,"p_seconds": number }; Returns: boolean
                           },
"my_permissions":
{ Args: Record<PropertyKey, never>; Returns: (string)[]
                           },
"pending_staff_invitation":
{ Args: { "p_email": string,"p_role": string }; Returns: string
                           },
"record_move":
{ Args: { "p_action": string,"p_end"?: string,"p_miles"?: number,"p_request": string,"p_start": string,"p_version": number }; Returns: undefined
                           },
"reopen_quote":
{ Args: { "p_request": string,"p_version": number }; Returns: undefined
                           },
"request_action":
{ Args: { "p_action": string,"p_id": string,"p_reason"?: string,"p_version": number }; Returns: undefined
                           },
"reserve_staff_invite":
{ Args: { "p_email": string,"p_role": string }; Returns: undefined
                           },
"save_note":
{ Args: { "p_body": string,"p_delete"?: boolean,"p_id"?: string,"p_request": string }; Returns: string
                           },
"save_quote":
{ Args: { "p_mode": string,"p_quantity": number,"p_rate": number,"p_request": string,"p_version": number,"p_workers": number }; Returns: string
                           },
"schedule_move":
{ Args: { "p_at": string,"p_duration": number,"p_notes": string,"p_request": string,"p_version": number }; Returns: string
                           },
"set_staff_active":
{ Args: { "p_active": boolean,"p_id": string }; Returns: undefined
                           },
"update_pricing_settings":
{ Args: { "p_four": number,"p_mile": number,"p_minimum": number,"p_three": number,"p_two": number,"p_version": number }; Returns: undefined
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

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "graphql_public": {
          Enums: {
            
          }
        },"public": {
          Enums: {
            
          }
        }
} as const
