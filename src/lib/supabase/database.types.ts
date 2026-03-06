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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      action_types: {
        Row: {
          action_type_id: string
          action_type_name: string
          category: string | null
          description_5th_grade: string | null
          example: string | null
          journey_id: string | null
        }
        Insert: {
          action_type_id: string
          action_type_name: string
          category?: string | null
          description_5th_grade?: string | null
          example?: string | null
          journey_id?: string | null
        }
        Update: {
          action_type_id?: string
          action_type_name?: string
          category?: string | null
          description_5th_grade?: string | null
          example?: string | null
          journey_id?: string | null
        }
        Relationships: []
      }
      agencies: {
        Row: {
          address: string | null
          agency_acronym: string | null
          agency_id: string
          agency_name: string
          city: string | null
          data_source: string | null
          description_5th_grade: string | null
          focus_area_ids: string | null
          gov_level_id: string | null
          jurisdiction: string | null
          last_updated: string | null
          parent_agency_id: string | null
          phone: string | null
          state: string | null
          website: string | null
          zip_code: number | null
        }
        Insert: {
          address?: string | null
          agency_acronym?: string | null
          agency_id: string
          agency_name: string
          city?: string | null
          data_source?: string | null
          description_5th_grade?: string | null
          focus_area_ids?: string | null
          gov_level_id?: string | null
          jurisdiction?: string | null
          last_updated?: string | null
          parent_agency_id?: string | null
          phone?: string | null
          state?: string | null
          website?: string | null
          zip_code?: number | null
        }
        Update: {
          address?: string | null
          agency_acronym?: string | null
          agency_id?: string
          agency_name?: string
          city?: string | null
          data_source?: string | null
          description_5th_grade?: string | null
          focus_area_ids?: string | null
          gov_level_id?: string | null
          jurisdiction?: string | null
          last_updated?: string | null
          parent_agency_id?: string | null
          phone?: string | null
          state?: string | null
          website?: string | null
          zip_code?: number | null
        }
        Relationships: []
      }
      agency_audience_segments: {
        Row: {
          agency_id: string
          segment_id: string
        }
        Insert: {
          agency_id: string
          segment_id: string
        }
        Update: {
          agency_id?: string
          segment_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agency_audience_segments_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["agency_id"]
          },
          {
            foreignKeyName: "agency_audience_segments_segment_id_fkey"
            columns: ["segment_id"]
            isOneToOne: false
            referencedRelation: "audience_segments"
            referencedColumns: ["segment_id"]
          },
        ]
      }
      agency_pathways: {
        Row: {
          agency_id: string
          is_primary: boolean
          theme_id: string
        }
        Insert: {
          agency_id: string
          is_primary?: boolean
          theme_id: string
        }
        Update: {
          agency_id?: string
          is_primary?: boolean
          theme_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agency_pathways_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["agency_id"]
          },
          {
            foreignKeyName: "agency_pathways_theme_id_fkey"
            columns: ["theme_id"]
            isOneToOne: false
            referencedRelation: "themes"
            referencedColumns: ["theme_id"]
          },
        ]
      }
      agency_sdgs: {
        Row: {
          agency_id: string
          sdg_id: string
        }
        Insert: {
          agency_id: string
          sdg_id: string
        }
        Update: {
          agency_id?: string
          sdg_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agency_sdgs_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["agency_id"]
          },
          {
            foreignKeyName: "agency_sdgs_sdg_id_fkey"
            columns: ["sdg_id"]
            isOneToOne: false
            referencedRelation: "sdgs"
            referencedColumns: ["sdg_id"]
          },
        ]
      }
      agency_service_categories: {
        Row: {
          agency_id: string
          service_cat_id: string
        }
        Insert: {
          agency_id: string
          service_cat_id: string
        }
        Update: {
          agency_id?: string
          service_cat_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agency_service_categories_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["agency_id"]
          },
          {
            foreignKeyName: "agency_service_categories_service_cat_id_fkey"
            columns: ["service_cat_id"]
            isOneToOne: false
            referencedRelation: "service_categories"
            referencedColumns: ["service_cat_id"]
          },
        ]
      }
      airs_codes: {
        Row: {
          airs_code: string
          airs_description: string | null
          airs_name: string
        }
        Insert: {
          airs_code: string
          airs_description?: string | null
          airs_name: string
        }
        Update: {
          airs_code?: string
          airs_description?: string | null
          airs_name?: string
        }
        Relationships: []
      }
      api_key_usage: {
        Row: {
          api_key_id: string
          id: string
          item_count: number | null
          request_count: number | null
          window_start: string
        }
        Insert: {
          api_key_id: string
          id?: string
          item_count?: number | null
          request_count?: number | null
          window_start: string
        }
        Update: {
          api_key_id?: string
          id?: string
          item_count?: number | null
          request_count?: number | null
          window_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "api_key_usage_api_key_id_fkey"
            columns: ["api_key_id"]
            isOneToOne: false
            referencedRelation: "api_keys"
            referencedColumns: ["id"]
          },
        ]
      }
      api_keys: {
        Row: {
          created_at: string | null
          created_by: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          key_hash: string
          key_prefix: string
          label: string
          last_used_at: string | null
          org_id: string | null
          rate_limit_per_day: number | null
          total_items: number | null
          total_requests: number | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          key_hash: string
          key_prefix: string
          label: string
          last_used_at?: string | null
          org_id?: string | null
          rate_limit_per_day?: number | null
          total_items?: number | null
          total_requests?: number | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          key_hash?: string
          key_prefix?: string
          label?: string
          last_used_at?: string | null
          org_id?: string | null
          rate_limit_per_day?: number | null
          total_items?: number | null
          total_requests?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "api_keys_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["org_id"]
          },
        ]
      }
      audience_segments: {
        Row: {
          description: string | null
          focus_area_affinity: string | null
          jobs_to_be_done: string | null
          segment_id: string
          segment_name: string
          typical_journeys: string | null
        }
        Insert: {
          description?: string | null
          focus_area_affinity?: string | null
          jobs_to_be_done?: string | null
          segment_id: string
          segment_name: string
          typical_journeys?: string | null
        }
        Update: {
          description?: string | null
          focus_area_affinity?: string | null
          jobs_to_be_done?: string | null
          segment_id?: string
          segment_name?: string
          typical_journeys?: string | null
        }
        Relationships: []
      }
      badges: {
        Row: {
          action_type_id: string | null
          badge_description: string | null
          badge_id: string
          badge_name: string
          badge_type: string | null
          color: string | null
          data_source: string | null
          description_5th_grade: string | null
          icon_name: string | null
          is_active: string | null
          last_updated: string | null
          path_id: string | null
          points: number | null
          requirement_count: number | null
          requirement_type: string | null
        }
        Insert: {
          action_type_id?: string | null
          badge_description?: string | null
          badge_id: string
          badge_name: string
          badge_type?: string | null
          color?: string | null
          data_source?: string | null
          description_5th_grade?: string | null
          icon_name?: string | null
          is_active?: string | null
          last_updated?: string | null
          path_id?: string | null
          points?: number | null
          requirement_count?: number | null
          requirement_type?: string | null
        }
        Update: {
          action_type_id?: string | null
          badge_description?: string | null
          badge_id?: string
          badge_name?: string
          badge_type?: string | null
          color?: string | null
          data_source?: string | null
          description_5th_grade?: string | null
          icon_name?: string | null
          is_active?: string | null
          last_updated?: string | null
          path_id?: string | null
          points?: number | null
          requirement_count?: number | null
          requirement_type?: string | null
        }
        Relationships: []
      }
      ballot_item_audience_segments: {
        Row: {
          item_id: string
          segment_id: string
        }
        Insert: {
          item_id: string
          segment_id: string
        }
        Update: {
          item_id?: string
          segment_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ballot_item_audience_segments_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "ballot_items"
            referencedColumns: ["item_id"]
          },
          {
            foreignKeyName: "ballot_item_audience_segments_segment_id_fkey"
            columns: ["segment_id"]
            isOneToOne: false
            referencedRelation: "audience_segments"
            referencedColumns: ["segment_id"]
          },
        ]
      }
      ballot_item_pathways: {
        Row: {
          is_primary: boolean
          item_id: string
          theme_id: string
        }
        Insert: {
          is_primary?: boolean
          item_id: string
          theme_id: string
        }
        Update: {
          is_primary?: boolean
          item_id?: string
          theme_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ballot_item_pathways_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "ballot_items"
            referencedColumns: ["item_id"]
          },
          {
            foreignKeyName: "ballot_item_pathways_theme_id_fkey"
            columns: ["theme_id"]
            isOneToOne: false
            referencedRelation: "themes"
            referencedColumns: ["theme_id"]
          },
        ]
      }
      ballot_item_sdgs: {
        Row: {
          item_id: string
          sdg_id: string
        }
        Insert: {
          item_id: string
          sdg_id: string
        }
        Update: {
          item_id?: string
          sdg_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ballot_item_sdgs_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "ballot_items"
            referencedColumns: ["item_id"]
          },
          {
            foreignKeyName: "ballot_item_sdgs_sdg_id_fkey"
            columns: ["sdg_id"]
            isOneToOne: false
            referencedRelation: "sdgs"
            referencedColumns: ["sdg_id"]
          },
        ]
      }
      ballot_items: {
        Row: {
          against_argument: string | null
          campaign_id: string | null
          community_impact_summary: string | null
          data_source: string | null
          description: string | null
          description_5th_grade: string | null
          election_date: string | null
          election_id: string | null
          endorsements_against: string | null
          endorsements_for: string | null
          fiscal_impact: string | null
          focus_area_ids: string | null
          for_argument: string | null
          is_featured: string | null
          item_id: string
          item_name: string
          item_type: string | null
          jurisdiction: string | null
          last_updated: string | null
          passed: string | null
          vote_for_pct: number | null
        }
        Insert: {
          against_argument?: string | null
          campaign_id?: string | null
          community_impact_summary?: string | null
          data_source?: string | null
          description?: string | null
          description_5th_grade?: string | null
          election_date?: string | null
          election_id?: string | null
          endorsements_against?: string | null
          endorsements_for?: string | null
          fiscal_impact?: string | null
          focus_area_ids?: string | null
          for_argument?: string | null
          is_featured?: string | null
          item_id: string
          item_name: string
          item_type?: string | null
          jurisdiction?: string | null
          last_updated?: string | null
          passed?: string | null
          vote_for_pct?: number | null
        }
        Update: {
          against_argument?: string | null
          campaign_id?: string | null
          community_impact_summary?: string | null
          data_source?: string | null
          description?: string | null
          description_5th_grade?: string | null
          election_date?: string | null
          election_id?: string | null
          endorsements_against?: string | null
          endorsements_for?: string | null
          fiscal_impact?: string | null
          focus_area_ids?: string | null
          for_argument?: string | null
          is_featured?: string | null
          item_id?: string
          item_name?: string
          item_type?: string | null
          jurisdiction?: string | null
          last_updated?: string | null
          passed?: string | null
          vote_for_pct?: number | null
        }
        Relationships: []
      }
      benefit_audience_segments: {
        Row: {
          benefit_id: string
          segment_id: string
        }
        Insert: {
          benefit_id: string
          segment_id: string
        }
        Update: {
          benefit_id?: string
          segment_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "benefit_audience_segments_benefit_id_fkey"
            columns: ["benefit_id"]
            isOneToOne: false
            referencedRelation: "benefit_programs"
            referencedColumns: ["benefit_id"]
          },
          {
            foreignKeyName: "benefit_audience_segments_segment_id_fkey"
            columns: ["segment_id"]
            isOneToOne: false
            referencedRelation: "audience_segments"
            referencedColumns: ["segment_id"]
          },
        ]
      }
      benefit_life_situations: {
        Row: {
          benefit_id: string
          situation_id: string
        }
        Insert: {
          benefit_id: string
          situation_id: string
        }
        Update: {
          benefit_id?: string
          situation_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "benefit_life_situations_benefit_id_fkey"
            columns: ["benefit_id"]
            isOneToOne: false
            referencedRelation: "benefit_programs"
            referencedColumns: ["benefit_id"]
          },
          {
            foreignKeyName: "benefit_life_situations_situation_id_fkey"
            columns: ["situation_id"]
            isOneToOne: false
            referencedRelation: "life_situations"
            referencedColumns: ["situation_id"]
          },
        ]
      }
      benefit_pathways: {
        Row: {
          benefit_id: string
          is_primary: boolean
          theme_id: string
        }
        Insert: {
          benefit_id: string
          is_primary?: boolean
          theme_id: string
        }
        Update: {
          benefit_id?: string
          is_primary?: boolean
          theme_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "benefit_pathways_benefit_id_fkey"
            columns: ["benefit_id"]
            isOneToOne: false
            referencedRelation: "benefit_programs"
            referencedColumns: ["benefit_id"]
          },
          {
            foreignKeyName: "benefit_pathways_theme_id_fkey"
            columns: ["theme_id"]
            isOneToOne: false
            referencedRelation: "themes"
            referencedColumns: ["theme_id"]
          },
        ]
      }
      benefit_programs: {
        Row: {
          administering_agency: string | null
          application_method: string | null
          application_url: string | null
          asset_limit: string | null
          benefit_amount: string | null
          benefit_id: string
          benefit_name: string
          benefit_slug: string | null
          benefit_type: string | null
          data_source: string | null
          description_5th_grade: string | null
          documentation_needed: string | null
          eligibility_summary: string | null
          focus_area_ids: string | null
          gov_level_id: string | null
          household_types: string | null
          income_limit_description: string | null
          income_limit_percent_fpl: string | null
          is_active: string | null
          last_updated: string | null
          processing_days: string | null
          renewal_frequency: string | null
        }
        Insert: {
          administering_agency?: string | null
          application_method?: string | null
          application_url?: string | null
          asset_limit?: string | null
          benefit_amount?: string | null
          benefit_id: string
          benefit_name: string
          benefit_slug?: string | null
          benefit_type?: string | null
          data_source?: string | null
          description_5th_grade?: string | null
          documentation_needed?: string | null
          eligibility_summary?: string | null
          focus_area_ids?: string | null
          gov_level_id?: string | null
          household_types?: string | null
          income_limit_description?: string | null
          income_limit_percent_fpl?: string | null
          is_active?: string | null
          last_updated?: string | null
          processing_days?: string | null
          renewal_frequency?: string | null
        }
        Update: {
          administering_agency?: string | null
          application_method?: string | null
          application_url?: string | null
          asset_limit?: string | null
          benefit_amount?: string | null
          benefit_id?: string
          benefit_name?: string
          benefit_slug?: string | null
          benefit_type?: string | null
          data_source?: string | null
          description_5th_grade?: string | null
          documentation_needed?: string | null
          eligibility_summary?: string | null
          focus_area_ids?: string | null
          gov_level_id?: string | null
          household_types?: string | null
          income_limit_description?: string | null
          income_limit_percent_fpl?: string | null
          is_active?: string | null
          last_updated?: string | null
          processing_days?: string | null
          renewal_frequency?: string | null
        }
        Relationships: []
      }
      benefit_sdgs: {
        Row: {
          benefit_id: string
          sdg_id: string
        }
        Insert: {
          benefit_id: string
          sdg_id: string
        }
        Update: {
          benefit_id?: string
          sdg_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "benefit_sdgs_benefit_id_fkey"
            columns: ["benefit_id"]
            isOneToOne: false
            referencedRelation: "benefit_programs"
            referencedColumns: ["benefit_id"]
          },
          {
            foreignKeyName: "benefit_sdgs_sdg_id_fkey"
            columns: ["sdg_id"]
            isOneToOne: false
            referencedRelation: "sdgs"
            referencedColumns: ["sdg_id"]
          },
        ]
      }
      benefit_service_categories: {
        Row: {
          benefit_id: string
          service_cat_id: string
        }
        Insert: {
          benefit_id: string
          service_cat_id: string
        }
        Update: {
          benefit_id?: string
          service_cat_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "benefit_service_categories_benefit_id_fkey"
            columns: ["benefit_id"]
            isOneToOne: false
            referencedRelation: "benefit_programs"
            referencedColumns: ["benefit_id"]
          },
          {
            foreignKeyName: "benefit_service_categories_service_cat_id_fkey"
            columns: ["service_cat_id"]
            isOneToOne: false
            referencedRelation: "service_categories"
            referencedColumns: ["service_cat_id"]
          },
        ]
      }
      bill_sponsors: {
        Row: {
          created_at: string | null
          data_source: string | null
          id: string
          official_id: string
          policy_id: string
          role: string
        }
        Insert: {
          created_at?: string | null
          data_source?: string | null
          id?: string
          official_id: string
          policy_id: string
          role?: string
        }
        Update: {
          created_at?: string | null
          data_source?: string | null
          id?: string
          official_id?: string
          policy_id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "bill_sponsors_official_id_fkey"
            columns: ["official_id"]
            isOneToOne: false
            referencedRelation: "elected_officials"
            referencedColumns: ["official_id"]
          },
          {
            foreignKeyName: "bill_sponsors_official_id_fkey"
            columns: ["official_id"]
            isOneToOne: false
            referencedRelation: "officials_braided"
            referencedColumns: ["official_id"]
          },
          {
            foreignKeyName: "bill_sponsors_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "policies"
            referencedColumns: ["policy_id"]
          },
          {
            foreignKeyName: "bill_sponsors_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "policies_braided"
            referencedColumns: ["policy_id"]
          },
        ]
      }
      calls_to_action: {
        Row: {
          action_type_id: string | null
          campaign_id: string | null
          completions_count: number | null
          cta_id: string
          cta_name: string
          cta_slug: string | null
          cta_type: string | null
          data_source: string | null
          description_5th_grade: string | null
          end_date: string | null
          focus_area_ids: string | null
          goal_count: number | null
          impact_statement: string | null
          is_active: string | null
          is_featured: string | null
          is_urgent: string | null
          last_updated: string | null
          script_template: string | null
          start_date: string | null
          target_contact: string | null
          target_name: string | null
          target_position: string | null
          target_type: string | null
          time_commitment_id: string | null
          urgency_reason: string | null
        }
        Insert: {
          action_type_id?: string | null
          campaign_id?: string | null
          completions_count?: number | null
          cta_id: string
          cta_name: string
          cta_slug?: string | null
          cta_type?: string | null
          data_source?: string | null
          description_5th_grade?: string | null
          end_date?: string | null
          focus_area_ids?: string | null
          goal_count?: number | null
          impact_statement?: string | null
          is_active?: string | null
          is_featured?: string | null
          is_urgent?: string | null
          last_updated?: string | null
          script_template?: string | null
          start_date?: string | null
          target_contact?: string | null
          target_name?: string | null
          target_position?: string | null
          target_type?: string | null
          time_commitment_id?: string | null
          urgency_reason?: string | null
        }
        Update: {
          action_type_id?: string | null
          campaign_id?: string | null
          completions_count?: number | null
          cta_id?: string
          cta_name?: string
          cta_slug?: string | null
          cta_type?: string | null
          data_source?: string | null
          description_5th_grade?: string | null
          end_date?: string | null
          focus_area_ids?: string | null
          goal_count?: number | null
          impact_statement?: string | null
          is_active?: string | null
          is_featured?: string | null
          is_urgent?: string | null
          last_updated?: string | null
          script_template?: string | null
          start_date?: string | null
          target_contact?: string | null
          target_name?: string | null
          target_position?: string | null
          target_type?: string | null
          time_commitment_id?: string | null
          urgency_reason?: string | null
        }
        Relationships: []
      }
      campaign_audience_segments: {
        Row: {
          campaign_id: string
          segment_id: string
        }
        Insert: {
          campaign_id: string
          segment_id: string
        }
        Update: {
          campaign_id?: string
          segment_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_audience_segments_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["campaign_id"]
          },
          {
            foreignKeyName: "campaign_audience_segments_segment_id_fkey"
            columns: ["segment_id"]
            isOneToOne: false
            referencedRelation: "audience_segments"
            referencedColumns: ["segment_id"]
          },
        ]
      }
      campaign_pathways: {
        Row: {
          campaign_id: string
          is_primary: boolean
          theme_id: string
        }
        Insert: {
          campaign_id: string
          is_primary?: boolean
          theme_id: string
        }
        Update: {
          campaign_id?: string
          is_primary?: boolean
          theme_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_pathways_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["campaign_id"]
          },
          {
            foreignKeyName: "campaign_pathways_theme_id_fkey"
            columns: ["theme_id"]
            isOneToOne: false
            referencedRelation: "themes"
            referencedColumns: ["theme_id"]
          },
        ]
      }
      campaign_sdgs: {
        Row: {
          campaign_id: string
          sdg_id: string
        }
        Insert: {
          campaign_id: string
          sdg_id: string
        }
        Update: {
          campaign_id?: string
          sdg_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_sdgs_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["campaign_id"]
          },
          {
            foreignKeyName: "campaign_sdgs_sdg_id_fkey"
            columns: ["sdg_id"]
            isOneToOne: false
            referencedRelation: "sdgs"
            referencedColumns: ["sdg_id"]
          },
        ]
      }
      campaigns: {
        Row: {
          campaign_id: string
          campaign_name: string
          campaign_slug: string | null
          campaign_type: string | null
          county_ids: string | null
          cta_ids: string | null
          current_value: number | null
          data_source: string | null
          description_5th_grade: string | null
          end_date: string | null
          focus_area_ids: string | null
          goal_description: string | null
          is_featured: string | null
          last_updated: string | null
          org_id: string | null
          participant_count: number | null
          partner_org_ids: string | null
          resource_ids: string | null
          start_date: string | null
          status: string | null
          target_metric: string | null
          target_value: string | null
          theme_id: string | null
          urgency_level: string | null
        }
        Insert: {
          campaign_id: string
          campaign_name: string
          campaign_slug?: string | null
          campaign_type?: string | null
          county_ids?: string | null
          cta_ids?: string | null
          current_value?: number | null
          data_source?: string | null
          description_5th_grade?: string | null
          end_date?: string | null
          focus_area_ids?: string | null
          goal_description?: string | null
          is_featured?: string | null
          last_updated?: string | null
          org_id?: string | null
          participant_count?: number | null
          partner_org_ids?: string | null
          resource_ids?: string | null
          start_date?: string | null
          status?: string | null
          target_metric?: string | null
          target_value?: string | null
          theme_id?: string | null
          urgency_level?: string | null
        }
        Update: {
          campaign_id?: string
          campaign_name?: string
          campaign_slug?: string | null
          campaign_type?: string | null
          county_ids?: string | null
          cta_ids?: string | null
          current_value?: number | null
          data_source?: string | null
          description_5th_grade?: string | null
          end_date?: string | null
          focus_area_ids?: string | null
          goal_description?: string | null
          is_featured?: string | null
          last_updated?: string | null
          org_id?: string | null
          participant_count?: number | null
          partner_org_ids?: string | null
          resource_ids?: string | null
          start_date?: string | null
          status?: string | null
          target_metric?: string | null
          target_value?: string | null
          theme_id?: string | null
          urgency_level?: string | null
        }
        Relationships: []
      }
      candidates: {
        Row: {
          advanced_to_runoff: string | null
          bio_summary: string | null
          campaign_email: string | null
          campaign_phone: string | null
          campaign_website: string | null
          candidate_id: string
          candidate_name: string
          data_source: string | null
          district: string | null
          election_id: string | null
          endorsements: string | null
          fundraising_total: string | null
          general_date: string | null
          incumbent: string | null
          is_active: string | null
          last_updated: string | null
          linkedin_url: string | null
          office_level: string | null
          office_sought: string | null
          party: string | null
          photo_url: string | null
          policy_positions: string | null
          primary_date: string | null
          vote_count: number | null
          vote_pct: number | null
        }
        Insert: {
          advanced_to_runoff?: string | null
          bio_summary?: string | null
          campaign_email?: string | null
          campaign_phone?: string | null
          campaign_website?: string | null
          candidate_id: string
          candidate_name: string
          data_source?: string | null
          district?: string | null
          election_id?: string | null
          endorsements?: string | null
          fundraising_total?: string | null
          general_date?: string | null
          incumbent?: string | null
          is_active?: string | null
          last_updated?: string | null
          linkedin_url?: string | null
          office_level?: string | null
          office_sought?: string | null
          party?: string | null
          photo_url?: string | null
          policy_positions?: string | null
          primary_date?: string | null
          vote_count?: number | null
          vote_pct?: number | null
        }
        Update: {
          advanced_to_runoff?: string | null
          bio_summary?: string | null
          campaign_email?: string | null
          campaign_phone?: string | null
          campaign_website?: string | null
          candidate_id?: string
          candidate_name?: string
          data_source?: string | null
          district?: string | null
          election_id?: string | null
          endorsements?: string | null
          fundraising_total?: string | null
          general_date?: string | null
          incumbent?: string | null
          is_active?: string | null
          last_updated?: string | null
          linkedin_url?: string | null
          office_level?: string | null
          office_sought?: string | null
          party?: string | null
          photo_url?: string | null
          policy_positions?: string | null
          primary_date?: string | null
          vote_count?: number | null
          vote_pct?: number | null
        }
        Relationships: []
      }
      census_tracts: {
        Row: {
          broadband_pct: number | null
          county_fips: number | null
          county_id: string | null
          data_source: string | null
          geometry_type: string | null
          health_uninsured_pct: number | null
          housing_units: number | null
          last_updated: string | null
          median_income: number | null
          neighborhood_id: string | null
          owner_occupied_pct: number | null
          pct_asian: number | null
          pct_black: number | null
          pct_foreign_born: number | null
          pct_hispanic: number | null
          pct_limited_english: number | null
          pct_over_65: number | null
          pct_under_18: number | null
          pct_white: number | null
          population: number | null
          poverty_rate: number | null
          renter_occupied_pct: number | null
          snap_pct: number | null
          state_fips: number | null
          tract_geoid: number | null
          tract_id: string
          tract_name: number | null
          unemployment_rate: number | null
          vehicle_access_pct: number | null
        }
        Insert: {
          broadband_pct?: number | null
          county_fips?: number | null
          county_id?: string | null
          data_source?: string | null
          geometry_type?: string | null
          health_uninsured_pct?: number | null
          housing_units?: number | null
          last_updated?: string | null
          median_income?: number | null
          neighborhood_id?: string | null
          owner_occupied_pct?: number | null
          pct_asian?: number | null
          pct_black?: number | null
          pct_foreign_born?: number | null
          pct_hispanic?: number | null
          pct_limited_english?: number | null
          pct_over_65?: number | null
          pct_under_18?: number | null
          pct_white?: number | null
          population?: number | null
          poverty_rate?: number | null
          renter_occupied_pct?: number | null
          snap_pct?: number | null
          state_fips?: number | null
          tract_geoid?: number | null
          tract_id: string
          tract_name?: number | null
          unemployment_rate?: number | null
          vehicle_access_pct?: number | null
        }
        Update: {
          broadband_pct?: number | null
          county_fips?: number | null
          county_id?: string | null
          data_source?: string | null
          geometry_type?: string | null
          health_uninsured_pct?: number | null
          housing_units?: number | null
          last_updated?: string | null
          median_income?: number | null
          neighborhood_id?: string | null
          owner_occupied_pct?: number | null
          pct_asian?: number | null
          pct_black?: number | null
          pct_foreign_born?: number | null
          pct_hispanic?: number | null
          pct_limited_english?: number | null
          pct_over_65?: number | null
          pct_under_18?: number | null
          pct_white?: number | null
          population?: number | null
          poverty_rate?: number | null
          renter_occupied_pct?: number | null
          snap_pct?: number | null
          state_fips?: number | null
          tract_geoid?: number | null
          tract_id?: string
          tract_name?: number | null
          unemployment_rate?: number | null
          vehicle_access_pct?: number | null
        }
        Relationships: []
      }
      center_sections: {
        Row: {
          center: string | null
          color: string | null
          content_source: string | null
          data_source: string | null
          description_5th_grade: string | null
          display_order: number | null
          filter_criteria: string | null
          icon_name: string | null
          is_active: string | null
          item_limit: number | null
          last_updated: string | null
          section_id: string
          section_name: string
          section_slug: string | null
          section_type: string | null
          show_see_all: string | null
        }
        Insert: {
          center?: string | null
          color?: string | null
          content_source?: string | null
          data_source?: string | null
          description_5th_grade?: string | null
          display_order?: number | null
          filter_criteria?: string | null
          icon_name?: string | null
          is_active?: string | null
          item_limit?: number | null
          last_updated?: string | null
          section_id: string
          section_name: string
          section_slug?: string | null
          section_type?: string | null
          show_see_all?: string | null
        }
        Update: {
          center?: string | null
          color?: string | null
          content_source?: string | null
          data_source?: string | null
          description_5th_grade?: string | null
          display_order?: number | null
          filter_criteria?: string | null
          icon_name?: string | null
          is_active?: string | null
          item_limit?: number | null
          last_updated?: string | null
          section_id?: string
          section_name?: string
          section_slug?: string | null
          section_type?: string | null
          show_see_all?: string | null
        }
        Relationships: []
      }
      civic_calendar: {
        Row: {
          county_id: string | null
          cta_ids: string | null
          data_source: string | null
          date_end: string | null
          date_start: string | null
          description_5th_grade: string | null
          event_id: string
          event_name: string
          event_type: string | null
          focus_area_ids: string | null
          gov_level_id: string | null
          is_active: string | null
          is_deadline: string | null
          is_election: string | null
          is_featured: string | null
          is_virtual: string | null
          last_updated: string | null
          location_address: string | null
          location_city: string | null
          location_name: string | null
          recurrence: string | null
          registration_required: string | null
          registration_url: string | null
          reminder_days: number | null
          time_end: string | null
          time_start: string | null
          virtual_url: string | null
        }
        Insert: {
          county_id?: string | null
          cta_ids?: string | null
          data_source?: string | null
          date_end?: string | null
          date_start?: string | null
          description_5th_grade?: string | null
          event_id: string
          event_name: string
          event_type?: string | null
          focus_area_ids?: string | null
          gov_level_id?: string | null
          is_active?: string | null
          is_deadline?: string | null
          is_election?: string | null
          is_featured?: string | null
          is_virtual?: string | null
          last_updated?: string | null
          location_address?: string | null
          location_city?: string | null
          location_name?: string | null
          recurrence?: string | null
          registration_required?: string | null
          registration_url?: string | null
          reminder_days?: number | null
          time_end?: string | null
          time_start?: string | null
          virtual_url?: string | null
        }
        Update: {
          county_id?: string | null
          cta_ids?: string | null
          data_source?: string | null
          date_end?: string | null
          date_start?: string | null
          description_5th_grade?: string | null
          event_id?: string
          event_name?: string
          event_type?: string | null
          focus_area_ids?: string | null
          gov_level_id?: string | null
          is_active?: string | null
          is_deadline?: string | null
          is_election?: string | null
          is_featured?: string | null
          is_virtual?: string | null
          last_updated?: string | null
          location_address?: string | null
          location_city?: string | null
          location_name?: string | null
          recurrence?: string | null
          registration_required?: string | null
          registration_url?: string | null
          reminder_days?: number | null
          time_end?: string | null
          time_start?: string | null
          virtual_url?: string | null
        }
        Relationships: []
      }
      committee_assignments: {
        Row: {
          chamber: string | null
          committee_id: string | null
          committee_name: string
          created_at: string | null
          data_source: string | null
          end_date: string | null
          id: string
          jurisdiction_focus: string[] | null
          official_id: string
          pathway_ids: string[] | null
          role: string | null
          start_date: string | null
        }
        Insert: {
          chamber?: string | null
          committee_id?: string | null
          committee_name: string
          created_at?: string | null
          data_source?: string | null
          end_date?: string | null
          id?: string
          jurisdiction_focus?: string[] | null
          official_id: string
          pathway_ids?: string[] | null
          role?: string | null
          start_date?: string | null
        }
        Update: {
          chamber?: string | null
          committee_id?: string | null
          committee_name?: string
          created_at?: string | null
          data_source?: string | null
          end_date?: string | null
          id?: string
          jurisdiction_focus?: string[] | null
          official_id?: string
          pathway_ids?: string[] | null
          role?: string | null
          start_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "committee_assignments_official_id_fkey"
            columns: ["official_id"]
            isOneToOne: false
            referencedRelation: "elected_officials"
            referencedColumns: ["official_id"]
          },
          {
            foreignKeyName: "committee_assignments_official_id_fkey"
            columns: ["official_id"]
            isOneToOne: false
            referencedRelation: "officials_braided"
            referencedColumns: ["official_id"]
          },
        ]
      }
      community_edits: {
        Row: {
          created_at: string | null
          edit_id: string
          entity_id: string
          entity_name: string | null
          entity_type: string
          field_name: string | null
          reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          submitter_email: string | null
          suggested_value: string | null
        }
        Insert: {
          created_at?: string | null
          edit_id?: string
          entity_id: string
          entity_name?: string | null
          entity_type: string
          field_name?: string | null
          reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          submitter_email?: string | null
          suggested_value?: string | null
        }
        Update: {
          created_at?: string | null
          edit_id?: string
          entity_id?: string
          entity_name?: string | null
          entity_type?: string
          field_name?: string | null
          reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          submitter_email?: string | null
          suggested_value?: string | null
        }
        Relationships: []
      }
      contact_scripts: {
        Row: {
          body_template: string | null
          campaign_id: string | null
          closing_template: string | null
          cta_ids: string | null
          data_source: string | null
          focus_area_ids: string | null
          is_active: string | null
          issue_topic: string | null
          last_updated: string | null
          opening_template: string | null
          script_id: string
          script_name: string
          script_type: string | null
          talking_points: string | null
          target_level: string | null
          target_name: string | null
          target_position: string | null
          tone_guidance: string | null
        }
        Insert: {
          body_template?: string | null
          campaign_id?: string | null
          closing_template?: string | null
          cta_ids?: string | null
          data_source?: string | null
          focus_area_ids?: string | null
          is_active?: string | null
          issue_topic?: string | null
          last_updated?: string | null
          opening_template?: string | null
          script_id: string
          script_name: string
          script_type?: string | null
          talking_points?: string | null
          target_level?: string | null
          target_name?: string | null
          target_position?: string | null
          tone_guidance?: string | null
        }
        Update: {
          body_template?: string | null
          campaign_id?: string | null
          closing_template?: string | null
          cta_ids?: string | null
          data_source?: string | null
          focus_area_ids?: string | null
          is_active?: string | null
          issue_topic?: string | null
          last_updated?: string | null
          opening_template?: string | null
          script_id?: string
          script_name?: string
          script_type?: string | null
          talking_points?: string | null
          target_level?: string | null
          target_name?: string | null
          target_position?: string | null
          tone_guidance?: string | null
        }
        Relationships: []
      }
      content_audience_segments: {
        Row: {
          content_id: string
          segment_id: string
        }
        Insert: {
          content_id: string
          segment_id: string
        }
        Update: {
          content_id?: string
          segment_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_audience_segments_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "content_published"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_audience_segments_segment_id_fkey"
            columns: ["segment_id"]
            isOneToOne: false
            referencedRelation: "audience_segments"
            referencedColumns: ["segment_id"]
          },
        ]
      }
      content_focus_areas: {
        Row: {
          content_id: string
          focus_id: string
        }
        Insert: {
          content_id: string
          focus_id: string
        }
        Update: {
          content_id?: string
          focus_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_focus_areas_focus_id_fkey"
            columns: ["focus_id"]
            isOneToOne: false
            referencedRelation: "focus_areas"
            referencedColumns: ["focus_id"]
          },
        ]
      }
      content_inbox: {
        Row: {
          content_type: string | null
          created_at: string | null
          description: string | null
          extracted_text: string | null
          id: string
          image_url: string | null
          org_id: string | null
          scraped_at: string | null
          source_domain: string | null
          source_trust_level: string | null
          source_url: string
          status: string | null
          title: string | null
        }
        Insert: {
          content_type?: string | null
          created_at?: string | null
          description?: string | null
          extracted_text?: string | null
          id?: string
          image_url?: string | null
          org_id?: string | null
          scraped_at?: string | null
          source_domain?: string | null
          source_trust_level?: string | null
          source_url: string
          status?: string | null
          title?: string | null
        }
        Update: {
          content_type?: string | null
          created_at?: string | null
          description?: string | null
          extracted_text?: string | null
          id?: string
          image_url?: string | null
          org_id?: string | null
          scraped_at?: string | null
          source_domain?: string | null
          source_trust_level?: string | null
          source_url?: string
          status?: string | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "content_inbox_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["org_id"]
          },
        ]
      }
      content_life_situations: {
        Row: {
          content_id: string
          situation_id: string
        }
        Insert: {
          content_id: string
          situation_id: string
        }
        Update: {
          content_id?: string
          situation_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_life_situations_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "content_published"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_life_situations_situation_id_fkey"
            columns: ["situation_id"]
            isOneToOne: false
            referencedRelation: "life_situations"
            referencedColumns: ["situation_id"]
          },
        ]
      }
      content_neighborhoods: {
        Row: {
          content_id: string
          neighborhood: string
        }
        Insert: {
          content_id: string
          neighborhood: string
        }
        Update: {
          content_id?: string
          neighborhood?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_neighborhoods_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "content_published"
            referencedColumns: ["id"]
          },
        ]
      }
      content_pathways: {
        Row: {
          content_id: string
          is_primary: boolean | null
          theme_id: string
        }
        Insert: {
          content_id: string
          is_primary?: boolean | null
          theme_id: string
        }
        Update: {
          content_id?: string
          is_primary?: boolean | null
          theme_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_pathways_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "content_published"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_pathways_theme_id_fkey"
            columns: ["theme_id"]
            isOneToOne: false
            referencedRelation: "themes"
            referencedColumns: ["theme_id"]
          },
        ]
      }
      content_published: {
        Row: {
          action_apply: string | null
          action_attend: string | null
          action_call: string | null
          action_donate: string | null
          action_register: string | null
          action_signup: string | null
          action_volunteer: string | null
          audience_segments: string[] | null
          body: string | null
          center: string | null
          classification_reasoning: string | null
          confidence: number | null
          content_type: string | null
          curator_org_id: string | null
          engagement_level: string | null
          focus_area_ids: string[] | null
          fts: unknown
          geographic_scope: string | null
          id: string
          image_url: string | null
          inbox_id: string | null
          is_active: boolean | null
          is_featured: boolean | null
          last_updated: string | null
          life_situations: string[] | null
          object_type: string | null
          org_id: string | null
          pathway_primary: string | null
          pathway_secondary: string[] | null
          published_at: string | null
          resource_type: string | null
          sdg_ids: string[] | null
          sdoh_domain: string | null
          source_domain: string | null
          source_org_name: string | null
          source_url: string
          summary_6th_grade: string
          time_duration: string | null
          title_6th_grade: string
        }
        Insert: {
          action_apply?: string | null
          action_attend?: string | null
          action_call?: string | null
          action_donate?: string | null
          action_register?: string | null
          action_signup?: string | null
          action_volunteer?: string | null
          audience_segments?: string[] | null
          body?: string | null
          center?: string | null
          classification_reasoning?: string | null
          confidence?: number | null
          content_type?: string | null
          curator_org_id?: string | null
          engagement_level?: string | null
          focus_area_ids?: string[] | null
          fts?: unknown
          geographic_scope?: string | null
          id?: string
          image_url?: string | null
          inbox_id?: string | null
          is_active?: boolean | null
          is_featured?: boolean | null
          last_updated?: string | null
          life_situations?: string[] | null
          object_type?: string | null
          org_id?: string | null
          pathway_primary?: string | null
          pathway_secondary?: string[] | null
          published_at?: string | null
          resource_type?: string | null
          sdg_ids?: string[] | null
          sdoh_domain?: string | null
          source_domain?: string | null
          source_org_name?: string | null
          source_url: string
          summary_6th_grade: string
          time_duration?: string | null
          title_6th_grade: string
        }
        Update: {
          action_apply?: string | null
          action_attend?: string | null
          action_call?: string | null
          action_donate?: string | null
          action_register?: string | null
          action_signup?: string | null
          action_volunteer?: string | null
          audience_segments?: string[] | null
          body?: string | null
          center?: string | null
          classification_reasoning?: string | null
          confidence?: number | null
          content_type?: string | null
          curator_org_id?: string | null
          engagement_level?: string | null
          focus_area_ids?: string[] | null
          fts?: unknown
          geographic_scope?: string | null
          id?: string
          image_url?: string | null
          inbox_id?: string | null
          is_active?: boolean | null
          is_featured?: boolean | null
          last_updated?: string | null
          life_situations?: string[] | null
          object_type?: string | null
          org_id?: string | null
          pathway_primary?: string | null
          pathway_secondary?: string[] | null
          published_at?: string | null
          resource_type?: string | null
          sdg_ids?: string[] | null
          sdoh_domain?: string | null
          source_domain?: string | null
          source_org_name?: string | null
          source_url?: string
          summary_6th_grade?: string
          time_duration?: string | null
          title_6th_grade?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_published_inbox_id_fkey"
            columns: ["inbox_id"]
            isOneToOne: false
            referencedRelation: "content_inbox"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_published_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["org_id"]
          },
        ]
      }
      content_review_queue: {
        Row: {
          ai_classification: Json | null
          confidence: number | null
          content_type: string | null
          created_at: string | null
          id: string
          inbox_id: string | null
          org_id: string | null
          review_status: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          reviewer_notes: string | null
        }
        Insert: {
          ai_classification?: Json | null
          confidence?: number | null
          content_type?: string | null
          created_at?: string | null
          id?: string
          inbox_id?: string | null
          org_id?: string | null
          review_status?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewer_notes?: string | null
        }
        Update: {
          ai_classification?: Json | null
          confidence?: number | null
          content_type?: string | null
          created_at?: string | null
          id?: string
          inbox_id?: string | null
          org_id?: string | null
          review_status?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewer_notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "content_review_queue_inbox_id_fkey"
            columns: ["inbox_id"]
            isOneToOne: false
            referencedRelation: "content_inbox"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_review_queue_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["org_id"]
          },
        ]
      }
      content_sdgs: {
        Row: {
          content_id: string
          sdg_id: string
        }
        Insert: {
          content_id: string
          sdg_id: string
        }
        Update: {
          content_id?: string
          sdg_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_sdgs_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "content_published"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_sdgs_sdg_id_fkey"
            columns: ["sdg_id"]
            isOneToOne: false
            referencedRelation: "sdgs"
            referencedColumns: ["sdg_id"]
          },
        ]
      }
      content_service_categories: {
        Row: {
          content_id: string
          service_cat_id: string
        }
        Insert: {
          content_id: string
          service_cat_id: string
        }
        Update: {
          content_id?: string
          service_cat_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_service_categories_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "content_published"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_service_categories_service_cat_id_fkey"
            columns: ["service_cat_id"]
            isOneToOne: false
            referencedRelation: "service_categories"
            referencedColumns: ["service_cat_id"]
          },
        ]
      }
      content_skills: {
        Row: {
          content_id: string
          skill_id: string
        }
        Insert: {
          content_id: string
          skill_id: string
        }
        Update: {
          content_id?: string
          skill_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_skills_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "content_published"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_skills_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["skill_id"]
          },
        ]
      }
      content_zip_codes: {
        Row: {
          content_id: string
          zip_code: string
        }
        Insert: {
          content_id: string
          zip_code: string
        }
        Update: {
          content_id?: string
          zip_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_zip_codes_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "content_published"
            referencedColumns: ["id"]
          },
        ]
      }
      counties: {
        Row: {
          county_id: string
          county_name: string
          county_seat: string | null
          fips_code: number | null
          is_urban: string | null
          population_estimate: number | null
          region: string | null
        }
        Insert: {
          county_id: string
          county_name: string
          county_seat?: string | null
          fips_code?: number | null
          is_urban?: string | null
          population_estimate?: number | null
          region?: string | null
        }
        Update: {
          county_id?: string
          county_name?: string
          county_seat?: string | null
          fips_code?: number | null
          is_urban?: string | null
          population_estimate?: number | null
          region?: string | null
        }
        Relationships: []
      }
      coverage_stats: {
        Row: {
          content_count: number | null
          counties_covered: string[] | null
          coverage_score: number | null
          event_count: number | null
          focus_id: string
          last_content_date: string | null
          official_count: number | null
          org_count: number | null
          service_count: number | null
          updated_at: string | null
        }
        Insert: {
          content_count?: number | null
          counties_covered?: string[] | null
          coverage_score?: number | null
          event_count?: number | null
          focus_id: string
          last_content_date?: string | null
          official_count?: number | null
          org_count?: number | null
          service_count?: number | null
          updated_at?: string | null
        }
        Update: {
          content_count?: number | null
          counties_covered?: string[] | null
          coverage_score?: number | null
          event_count?: number | null
          focus_id?: string
          last_content_date?: string | null
          official_count?: number | null
          org_count?: number | null
          service_count?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coverage_stats_focus_id_fkey"
            columns: ["focus_id"]
            isOneToOne: true
            referencedRelation: "focus_areas"
            referencedColumns: ["focus_id"]
          },
        ]
      }
      data_sources: {
        Row: {
          api_available: string | null
          api_key_required: string | null
          api_url: string | null
          contact_email: string | null
          data_license: string | null
          data_source: string | null
          is_active: string | null
          last_pull_date: string | null
          last_updated: string | null
          notes: string | null
          organization: string | null
          source_id: string
          source_name: string
          source_type: string | null
          tables_using: string | null
          update_frequency: string | null
          url: string | null
        }
        Insert: {
          api_available?: string | null
          api_key_required?: string | null
          api_url?: string | null
          contact_email?: string | null
          data_license?: string | null
          data_source?: string | null
          is_active?: string | null
          last_pull_date?: string | null
          last_updated?: string | null
          notes?: string | null
          organization?: string | null
          source_id: string
          source_name: string
          source_type?: string | null
          tables_using?: string | null
          update_frequency?: string | null
          url?: string | null
        }
        Update: {
          api_available?: string | null
          api_key_required?: string | null
          api_url?: string | null
          contact_email?: string | null
          data_license?: string | null
          data_source?: string | null
          is_active?: string | null
          last_pull_date?: string | null
          last_updated?: string | null
          notes?: string | null
          organization?: string | null
          source_id?: string
          source_name?: string
          source_type?: string | null
          tables_using?: string | null
          update_frequency?: string | null
          url?: string | null
        }
        Relationships: []
      }
      distribution_sites: {
        Row: {
          address: string | null
          audience_segment_ids: string[] | null
          city: string | null
          county_id: string | null
          created_at: string | null
          data_source: string | null
          description: string | null
          focus_area_ids: string[] | null
          hours_of_operation: Json | null
          is_active: boolean | null
          languages: string[] | null
          last_synced_at: string | null
          latitude: number | null
          life_situation_ids: string[] | null
          longitude: number | null
          org_id: string
          phone: string | null
          requirements: string | null
          resource_type_id: string | null
          serves_zip_codes: string[] | null
          site_id: string
          site_name: string
          site_type: string | null
          source_id: string | null
          state: string | null
          updated_at: string | null
          zip_code: string | null
        }
        Insert: {
          address?: string | null
          audience_segment_ids?: string[] | null
          city?: string | null
          county_id?: string | null
          created_at?: string | null
          data_source?: string | null
          description?: string | null
          focus_area_ids?: string[] | null
          hours_of_operation?: Json | null
          is_active?: boolean | null
          languages?: string[] | null
          last_synced_at?: string | null
          latitude?: number | null
          life_situation_ids?: string[] | null
          longitude?: number | null
          org_id: string
          phone?: string | null
          requirements?: string | null
          resource_type_id?: string | null
          serves_zip_codes?: string[] | null
          site_id: string
          site_name: string
          site_type?: string | null
          source_id?: string | null
          state?: string | null
          updated_at?: string | null
          zip_code?: string | null
        }
        Update: {
          address?: string | null
          audience_segment_ids?: string[] | null
          city?: string | null
          county_id?: string | null
          created_at?: string | null
          data_source?: string | null
          description?: string | null
          focus_area_ids?: string[] | null
          hours_of_operation?: Json | null
          is_active?: boolean | null
          languages?: string[] | null
          last_synced_at?: string | null
          latitude?: number | null
          life_situation_ids?: string[] | null
          longitude?: number | null
          org_id?: string
          phone?: string | null
          requirements?: string | null
          resource_type_id?: string | null
          serves_zip_codes?: string[] | null
          site_id?: string
          site_name?: string
          site_type?: string | null
          source_id?: string | null
          state?: string | null
          updated_at?: string | null
          zip_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "distribution_sites_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["org_id"]
          },
        ]
      }
      elected_officials: {
        Row: {
          address: string | null
          bio: string | null
          bioguide_id: string | null
          classification_v2: Json | null
          counties_served: string | null
          data_source: string | null
          description_5th_grade: string | null
          district_id: string | null
          district_type: string | null
          email: string | null
          focus_area_ids: string | null
          fts: unknown
          gov_level_id: string | null
          jurisdiction: string | null
          last_updated: string | null
          level: string | null
          office_address: string | null
          office_phone: string | null
          official_id: string
          official_name: string
          openstates_id: string | null
          party: string | null
          photo_url: string | null
          social_media: Json | null
          term_end: string | null
          title: string | null
          website: string | null
        }
        Insert: {
          address?: string | null
          bio?: string | null
          bioguide_id?: string | null
          classification_v2?: Json | null
          counties_served?: string | null
          data_source?: string | null
          description_5th_grade?: string | null
          district_id?: string | null
          district_type?: string | null
          email?: string | null
          focus_area_ids?: string | null
          fts?: unknown
          gov_level_id?: string | null
          jurisdiction?: string | null
          last_updated?: string | null
          level?: string | null
          office_address?: string | null
          office_phone?: string | null
          official_id: string
          official_name: string
          openstates_id?: string | null
          party?: string | null
          photo_url?: string | null
          social_media?: Json | null
          term_end?: string | null
          title?: string | null
          website?: string | null
        }
        Update: {
          address?: string | null
          bio?: string | null
          bioguide_id?: string | null
          classification_v2?: Json | null
          counties_served?: string | null
          data_source?: string | null
          description_5th_grade?: string | null
          district_id?: string | null
          district_type?: string | null
          email?: string | null
          focus_area_ids?: string | null
          fts?: unknown
          gov_level_id?: string | null
          jurisdiction?: string | null
          last_updated?: string | null
          level?: string | null
          office_address?: string | null
          office_phone?: string | null
          official_id?: string
          official_name?: string
          openstates_id?: string | null
          party?: string | null
          photo_url?: string | null
          social_media?: Json | null
          term_end?: string | null
          title?: string | null
          website?: string | null
        }
        Relationships: []
      }
      elections: {
        Row: {
          ballot_items: string | null
          community_impact_summary: string | null
          data_source: string | null
          description: string | null
          early_voting_end: string | null
          early_voting_start: string | null
          election_date: string | null
          election_id: string
          election_name: string
          election_type: string | null
          is_active: string | null
          jurisdiction: string | null
          last_updated: string | null
          registration_deadline: string | null
          results_certified: string | null
          turnout_pct: number | null
        }
        Insert: {
          ballot_items?: string | null
          community_impact_summary?: string | null
          data_source?: string | null
          description?: string | null
          early_voting_end?: string | null
          early_voting_start?: string | null
          election_date?: string | null
          election_id: string
          election_name: string
          election_type?: string | null
          is_active?: string | null
          jurisdiction?: string | null
          last_updated?: string | null
          registration_deadline?: string | null
          results_certified?: string | null
          turnout_pct?: number | null
        }
        Update: {
          ballot_items?: string | null
          community_impact_summary?: string | null
          data_source?: string | null
          description?: string | null
          early_voting_end?: string | null
          early_voting_start?: string | null
          election_date?: string | null
          election_id?: string
          election_name?: string
          election_type?: string | null
          is_active?: string | null
          jurisdiction?: string | null
          last_updated?: string | null
          registration_deadline?: string | null
          results_certified?: string | null
          turnout_pct?: number | null
        }
        Relationships: []
      }
      entity_completeness: {
        Row: {
          completeness_score: number
          completeness_tier: string
          critical_missing: string[]
          entity_id: string
          entity_name: string
          entity_type: string
          field_scores: Json
          filled_fields: number
          missing_fields: string[]
          scored_at: string
          total_fields: number
        }
        Insert: {
          completeness_score?: number
          completeness_tier?: string
          critical_missing?: string[]
          entity_id: string
          entity_name?: string
          entity_type: string
          field_scores?: Json
          filled_fields?: number
          missing_fields?: string[]
          scored_at?: string
          total_fields?: number
        }
        Update: {
          completeness_score?: number
          completeness_tier?: string
          critical_missing?: string[]
          entity_id?: string
          entity_name?: string
          entity_type?: string
          field_scores?: Json
          filled_fields?: number
          missing_fields?: string[]
          scored_at?: string
          total_fields?: number
        }
        Relationships: []
      }
      events: {
        Row: {
          action_type_id: string | null
          address: string | null
          city: string | null
          cost: number | null
          county_id: string | null
          data_source: string | null
          description_5th_grade: string | null
          end_datetime: string | null
          event_id: string
          event_name: string
          event_type: string | null
          focus_area_ids: string | null
          is_active: string | null
          is_free: string | null
          is_recurring: string | null
          is_virtual: string | null
          last_updated: string | null
          org_id: string | null
          recurrence_pattern: string | null
          registration_required: string | null
          registration_url: string | null
          start_datetime: string | null
          state: string | null
          zip_code: string | null
        }
        Insert: {
          action_type_id?: string | null
          address?: string | null
          city?: string | null
          cost?: number | null
          county_id?: string | null
          data_source?: string | null
          description_5th_grade?: string | null
          end_datetime?: string | null
          event_id: string
          event_name: string
          event_type?: string | null
          focus_area_ids?: string | null
          is_active?: string | null
          is_free?: string | null
          is_recurring?: string | null
          is_virtual?: string | null
          last_updated?: string | null
          org_id?: string | null
          recurrence_pattern?: string | null
          registration_required?: string | null
          registration_url?: string | null
          start_datetime?: string | null
          state?: string | null
          zip_code?: string | null
        }
        Update: {
          action_type_id?: string | null
          address?: string | null
          city?: string | null
          cost?: number | null
          county_id?: string | null
          data_source?: string | null
          description_5th_grade?: string | null
          end_datetime?: string | null
          event_id?: string
          event_name?: string
          event_type?: string | null
          focus_area_ids?: string | null
          is_active?: string | null
          is_free?: string | null
          is_recurring?: string | null
          is_virtual?: string | null
          last_updated?: string | null
          org_id?: string | null
          recurrence_pattern?: string | null
          registration_required?: string | null
          registration_url?: string | null
          start_datetime?: string | null
          state?: string | null
          zip_code?: string | null
        }
        Relationships: []
      }
      faqs: {
        Row: {
          answer: string | null
          category: string | null
          data_source: string | null
          display_order: number | null
          faq_id: string
          focus_area_ids: string | null
          is_active: string | null
          is_featured: string | null
          language_ids: string | null
          last_updated: string | null
          path_id: string | null
          question: string
          resource_id: string | null
          situation_id: string | null
        }
        Insert: {
          answer?: string | null
          category?: string | null
          data_source?: string | null
          display_order?: number | null
          faq_id: string
          focus_area_ids?: string | null
          is_active?: string | null
          is_featured?: string | null
          language_ids?: string | null
          last_updated?: string | null
          path_id?: string | null
          question: string
          resource_id?: string | null
          situation_id?: string | null
        }
        Update: {
          answer?: string | null
          category?: string | null
          data_source?: string | null
          display_order?: number | null
          faq_id?: string
          focus_area_ids?: string | null
          is_active?: string | null
          is_featured?: string | null
          language_ids?: string | null
          last_updated?: string | null
          path_id?: string | null
          question?: string
          resource_id?: string | null
          situation_id?: string | null
        }
        Relationships: []
      }
      featured_collections: {
        Row: {
          center: string | null
          collection_id: string
          collection_name: string
          collection_slug: string | null
          collection_type: string | null
          color: string | null
          data_source: string | null
          description_5th_grade: string | null
          display_order: number | null
          end_date: string | null
          focus_area_ids: string | null
          icon_name: string | null
          is_active: string | null
          is_featured: string | null
          item_ids: string | null
          item_type: string | null
          last_updated: string | null
          start_date: string | null
          theme_id: string | null
        }
        Insert: {
          center?: string | null
          collection_id: string
          collection_name: string
          collection_slug?: string | null
          collection_type?: string | null
          color?: string | null
          data_source?: string | null
          description_5th_grade?: string | null
          display_order?: number | null
          end_date?: string | null
          focus_area_ids?: string | null
          icon_name?: string | null
          is_active?: string | null
          is_featured?: string | null
          item_ids?: string | null
          item_type?: string | null
          last_updated?: string | null
          start_date?: string | null
          theme_id?: string | null
        }
        Update: {
          center?: string | null
          collection_id?: string
          collection_name?: string
          collection_slug?: string | null
          collection_type?: string | null
          color?: string | null
          data_source?: string | null
          description_5th_grade?: string | null
          display_order?: number | null
          end_date?: string | null
          focus_area_ids?: string | null
          icon_name?: string | null
          is_active?: string | null
          is_featured?: string | null
          item_ids?: string | null
          item_type?: string | null
          last_updated?: string | null
          start_date?: string | null
          theme_id?: string | null
        }
        Relationships: []
      }
      focus_areas: {
        Row: {
          airs_code: string | null
          description: string | null
          focus_area_name: string
          focus_id: string
          is_bridging: boolean | null
          ntee_code: string | null
          sdg_id: string | null
          sdoh_code: string | null
          theme_id: string | null
        }
        Insert: {
          airs_code?: string | null
          description?: string | null
          focus_area_name: string
          focus_id: string
          is_bridging?: boolean | null
          ntee_code?: string | null
          sdg_id?: string | null
          sdoh_code?: string | null
          theme_id?: string | null
        }
        Update: {
          airs_code?: string | null
          description?: string | null
          focus_area_name?: string
          focus_id?: string
          is_bridging?: boolean | null
          ntee_code?: string | null
          sdg_id?: string | null
          sdoh_code?: string | null
          theme_id?: string | null
        }
        Relationships: []
      }
      foundation_expansion_log: {
        Row: {
          completed_at: string | null
          created_at: string | null
          error_message: string | null
          foundations_added: number | null
          id: string
          people_added: number | null
          started_at: string | null
          state_code: string
          state_name: string
          status: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          foundations_added?: number | null
          id?: string
          people_added?: number | null
          started_at?: string | null
          state_code: string
          state_name: string
          status?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          foundations_added?: number | null
          id?: string
          people_added?: number | null
          started_at?: string | null
          state_code?: string
          state_name?: string
          status?: string | null
        }
        Relationships: []
      }
      foundation_fidelity_log: {
        Row: {
          duration_ms: number | null
          foundations_checked: number | null
          id: string
          issues_found: number | null
          issues_resolved: number | null
          notes: string | null
          run_at: string | null
          status: string | null
          websites_verified: number | null
        }
        Insert: {
          duration_ms?: number | null
          foundations_checked?: number | null
          id?: string
          issues_found?: number | null
          issues_resolved?: number | null
          notes?: string | null
          run_at?: string | null
          status?: string | null
          websites_verified?: number | null
        }
        Update: {
          duration_ms?: number | null
          foundations_checked?: number | null
          id?: string
          issues_found?: number | null
          issues_resolved?: number | null
          notes?: string | null
          run_at?: string | null
          status?: string | null
          websites_verified?: number | null
        }
        Relationships: []
      }
      foundation_focus_areas: {
        Row: {
          focus_area: string
          foundation_id: string
        }
        Insert: {
          focus_area: string
          foundation_id: string
        }
        Update: {
          focus_area?: string
          foundation_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "foundation_focus_areas_foundation_id_fkey"
            columns: ["foundation_id"]
            isOneToOne: false
            referencedRelation: "foundations"
            referencedColumns: ["id"]
          },
        ]
      }
      foundation_pathways: {
        Row: {
          foundation_id: string
          pathway_id: string
        }
        Insert: {
          foundation_id: string
          pathway_id: string
        }
        Update: {
          foundation_id?: string
          pathway_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "foundation_pathways_foundation_id_fkey"
            columns: ["foundation_id"]
            isOneToOne: false
            referencedRelation: "foundations"
            referencedColumns: ["id"]
          },
        ]
      }
      foundation_people: {
        Row: {
          created_at: string | null
          email: string | null
          foundation_id: string
          id: string
          is_current: boolean | null
          last_verified_at: string | null
          linkedin_status: string | null
          linkedin_url: string | null
          name: string
          phone: string | null
          role: string
          role_type: string
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          foundation_id: string
          id?: string
          is_current?: boolean | null
          last_verified_at?: string | null
          linkedin_status?: string | null
          linkedin_url?: string | null
          name: string
          phone?: string | null
          role: string
          role_type: string
        }
        Update: {
          created_at?: string | null
          email?: string | null
          foundation_id?: string
          id?: string
          is_current?: boolean | null
          last_verified_at?: string | null
          linkedin_status?: string | null
          linkedin_url?: string | null
          name?: string
          phone?: string | null
          role?: string
          role_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "foundation_people_foundation_id_fkey"
            columns: ["foundation_id"]
            isOneToOne: false
            referencedRelation: "foundations"
            referencedColumns: ["id"]
          },
        ]
      }
      foundation_zip_coverage: {
        Row: {
          coverage_type: string | null
          foundation_id: string
          zip_code: string
        }
        Insert: {
          coverage_type?: string | null
          foundation_id: string
          zip_code: string
        }
        Update: {
          coverage_type?: string | null
          foundation_id?: string
          zip_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "foundation_zip_coverage_foundation_id_fkey"
            columns: ["foundation_id"]
            isOneToOne: false
            referencedRelation: "foundations"
            referencedColumns: ["id"]
          },
        ]
      }
      foundations: {
        Row: {
          address: string | null
          annual_giving: string | null
          assets: string | null
          batch_added: string | null
          city: string | null
          coverage_states: string[] | null
          coverage_zips: string[] | null
          created_at: string | null
          data_source: string | null
          email: string | null
          founded_year: number | null
          geo_level: string
          id: string
          last_people_sync: string | null
          last_updated_at: string | null
          last_verified_at: string | null
          mission: string | null
          name: string
          org_id: string | null
          phone: string | null
          slug: string
          source_state: string | null
          state_code: string | null
          type: string
          verification_notes: string | null
          verification_status: string | null
          website_display: string | null
          website_url: string | null
          zip_code: string | null
        }
        Insert: {
          address?: string | null
          annual_giving?: string | null
          assets?: string | null
          batch_added?: string | null
          city?: string | null
          coverage_states?: string[] | null
          coverage_zips?: string[] | null
          created_at?: string | null
          data_source?: string | null
          email?: string | null
          founded_year?: number | null
          geo_level: string
          id?: string
          last_people_sync?: string | null
          last_updated_at?: string | null
          last_verified_at?: string | null
          mission?: string | null
          name: string
          org_id?: string | null
          phone?: string | null
          slug: string
          source_state?: string | null
          state_code?: string | null
          type?: string
          verification_notes?: string | null
          verification_status?: string | null
          website_display?: string | null
          website_url?: string | null
          zip_code?: string | null
        }
        Update: {
          address?: string | null
          annual_giving?: string | null
          assets?: string | null
          batch_added?: string | null
          city?: string | null
          coverage_states?: string[] | null
          coverage_zips?: string[] | null
          created_at?: string | null
          data_source?: string | null
          email?: string | null
          founded_year?: number | null
          geo_level?: string
          id?: string
          last_people_sync?: string | null
          last_updated_at?: string | null
          last_verified_at?: string | null
          mission?: string | null
          name?: string
          org_id?: string | null
          phone?: string | null
          slug?: string
          source_state?: string | null
          state_code?: string | null
          type?: string
          verification_notes?: string | null
          verification_status?: string | null
          website_display?: string | null
          website_url?: string | null
          zip_code?: string | null
        }
        Relationships: []
      }
      geocode_cache: {
        Row: {
          address_hash: string
          census_tract: string | null
          congressional_district: string | null
          council_district: string | null
          county_fips: string | null
          created_at: string | null
          id: string
          latitude: number | null
          longitude: number | null
          neighborhood_id: string | null
          precinct_id: string | null
          raw_address: string | null
          school_district_id: string | null
          state_fips: string | null
          state_house_district: string | null
          state_senate_district: string | null
          zip_code: string | null
        }
        Insert: {
          address_hash: string
          census_tract?: string | null
          congressional_district?: string | null
          council_district?: string | null
          county_fips?: string | null
          created_at?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          neighborhood_id?: string | null
          precinct_id?: string | null
          raw_address?: string | null
          school_district_id?: string | null
          state_fips?: string | null
          state_house_district?: string | null
          state_senate_district?: string | null
          zip_code?: string | null
        }
        Update: {
          address_hash?: string
          census_tract?: string | null
          congressional_district?: string | null
          council_district?: string | null
          county_fips?: string | null
          created_at?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          neighborhood_id?: string | null
          precinct_id?: string | null
          raw_address?: string | null
          school_district_id?: string | null
          state_fips?: string | null
          state_house_district?: string | null
          state_senate_district?: string | null
          zip_code?: string | null
        }
        Relationships: []
      }
      glossary: {
        Row: {
          category: string | null
          data_source: string | null
          definition: string | null
          definition_5th_grade: string | null
          focus_area_ids: string | null
          is_featured: string | null
          last_updated: string | null
          related_terms: string | null
          term: string
          term_id: string
        }
        Insert: {
          category?: string | null
          data_source?: string | null
          definition?: string | null
          definition_5th_grade?: string | null
          focus_area_ids?: string | null
          is_featured?: string | null
          last_updated?: string | null
          related_terms?: string | null
          term: string
          term_id: string
        }
        Update: {
          category?: string | null
          data_source?: string | null
          definition?: string | null
          definition_5th_grade?: string | null
          focus_area_ids?: string | null
          is_featured?: string | null
          last_updated?: string | null
          related_terms?: string | null
          term?: string
          term_id?: string
        }
        Relationships: []
      }
      government_levels: {
        Row: {
          data_sources: string | null
          description_5th_grade: string | null
          example_positions: string | null
          gov_level_id: string
          gov_level_name: string
          level_order: number | null
        }
        Insert: {
          data_sources?: string | null
          description_5th_grade?: string | null
          example_positions?: string | null
          gov_level_id: string
          gov_level_name: string
          level_order?: number | null
        }
        Update: {
          data_sources?: string | null
          description_5th_grade?: string | null
          example_positions?: string | null
          gov_level_id?: string
          gov_level_name?: string
          level_order?: number | null
        }
        Relationships: []
      }
      guides: {
        Row: {
          content_html: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          display_order: number | null
          engagement_level: string | null
          focus_area_ids: string[] | null
          guide_id: string
          hero_image_url: string | null
          is_active: boolean | null
          org_id: string | null
          review_status: string | null
          sections: Json | null
          slug: string
          source_url: string | null
          theme_id: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          content_html?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          display_order?: number | null
          engagement_level?: string | null
          focus_area_ids?: string[] | null
          guide_id: string
          hero_image_url?: string | null
          is_active?: boolean | null
          org_id?: string | null
          review_status?: string | null
          sections?: Json | null
          slug: string
          source_url?: string | null
          theme_id?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          content_html?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          display_order?: number | null
          engagement_level?: string | null
          focus_area_ids?: string[] | null
          guide_id?: string
          hero_image_url?: string | null
          is_active?: boolean | null
          org_id?: string | null
          review_status?: string | null
          sections?: Json | null
          slug?: string
          source_url?: string | null
          theme_id?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      ingestion_log: {
        Row: {
          created_at: string | null
          duration_ms: number | null
          event_type: string
          id: string
          item_count: number | null
          message: string | null
          source: string | null
          source_url: string | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          duration_ms?: number | null
          event_type: string
          id?: string
          item_count?: number | null
          message?: string | null
          source?: string | null
          source_url?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          duration_ms?: number | null
          event_type?: string
          id?: string
          item_count?: number | null
          message?: string | null
          source?: string | null
          source_url?: string | null
          status?: string | null
        }
        Relationships: []
      }
      irs_subsections: {
        Row: {
          can_lobby: string | null
          description_5th_grade: string | null
          donations_deductible: string | null
          irs_code: string
          irs_name: string
          irs_subsection_id: string
        }
        Insert: {
          can_lobby?: string | null
          description_5th_grade?: string | null
          donations_deductible?: string | null
          irs_code: string
          irs_name: string
          irs_subsection_id: string
        }
        Update: {
          can_lobby?: string | null
          description_5th_grade?: string | null
          donations_deductible?: string | null
          irs_code?: string
          irs_name?: string
          irs_subsection_id?: string
        }
        Relationships: []
      }
      kb_chat_messages: {
        Row: {
          content: string
          created_at: string | null
          id: string
          role: string
          session_id: string
          sources: Json | null
        }
        Insert: {
          content?: string
          created_at?: string | null
          id?: string
          role: string
          session_id: string
          sources?: Json | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          role?: string
          session_id?: string
          sources?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "kb_chat_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "kb_chat_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      kb_chat_sessions: {
        Row: {
          created_at: string | null
          id: string
          title: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          title?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          title?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      kb_chunks: {
        Row: {
          chunk_index: number
          content: string
          document_id: string
          id: string
          page_end: number | null
          page_start: number | null
          search_vector: unknown
        }
        Insert: {
          chunk_index?: number
          content?: string
          document_id: string
          id?: string
          page_end?: number | null
          page_start?: number | null
          search_vector?: unknown
        }
        Update: {
          chunk_index?: number
          content?: string
          document_id?: string
          id?: string
          page_end?: number | null
          page_start?: number | null
          search_vector?: unknown
        }
        Relationships: [
          {
            foreignKeyName: "kb_chunks_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "kb_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      kb_documents: {
        Row: {
          created_at: string | null
          file_path: string
          file_size: number | null
          focus_area_ids: string[] | null
          id: string
          key_points: string[] | null
          page_count: number | null
          published_at: string | null
          search_vector: unknown
          status: string
          summary: string | null
          tags: string[] | null
          theme_ids: string[] | null
          title: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string | null
          file_path: string
          file_size?: number | null
          focus_area_ids?: string[] | null
          id?: string
          key_points?: string[] | null
          page_count?: number | null
          published_at?: string | null
          search_vector?: unknown
          status?: string
          summary?: string | null
          tags?: string[] | null
          theme_ids?: string[] | null
          title?: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string | null
          file_path?: string
          file_size?: number | null
          focus_area_ids?: string[] | null
          id?: string
          key_points?: string[] | null
          page_count?: number | null
          published_at?: string | null
          search_vector?: unknown
          status?: string
          summary?: string | null
          tags?: string[] | null
          theme_ids?: string[] | null
          title?: string
          uploaded_by?: string | null
        }
        Relationships: []
      }
      languages: {
        Row: {
          is_common_in_houston: string | null
          language_code: string | null
          language_id: string
          language_name: string
        }
        Insert: {
          is_common_in_houston?: string | null
          language_code?: string | null
          language_id: string
          language_name: string
        }
        Update: {
          is_common_in_houston?: string | null
          language_code?: string | null
          language_id?: string
          language_name?: string
        }
        Relationships: []
      }
      learning_modules: {
        Row: {
          content_type: string | null
          data_source: string | null
          description_5th_grade: string | null
          estimated_minutes: number | null
          focus_area_ids: string | null
          has_quiz: string | null
          is_active: string | null
          is_required: string | null
          last_updated: string | null
          learning_objectives: string | null
          module_description: string | null
          module_id: string
          module_name: string
          module_order: number | null
          path_id: string | null
          quiz_id: string | null
          resource_ids: string | null
        }
        Insert: {
          content_type?: string | null
          data_source?: string | null
          description_5th_grade?: string | null
          estimated_minutes?: number | null
          focus_area_ids?: string | null
          has_quiz?: string | null
          is_active?: string | null
          is_required?: string | null
          last_updated?: string | null
          learning_objectives?: string | null
          module_description?: string | null
          module_id: string
          module_name: string
          module_order?: number | null
          path_id?: string | null
          quiz_id?: string | null
          resource_ids?: string | null
        }
        Update: {
          content_type?: string | null
          data_source?: string | null
          description_5th_grade?: string | null
          estimated_minutes?: number | null
          focus_area_ids?: string | null
          has_quiz?: string | null
          is_active?: string | null
          is_required?: string | null
          last_updated?: string | null
          learning_objectives?: string | null
          module_description?: string | null
          module_id?: string
          module_name?: string
          module_order?: number | null
          path_id?: string | null
          quiz_id?: string | null
          resource_ids?: string | null
        }
        Relationships: []
      }
      learning_paths: {
        Row: {
          badge_id: string | null
          data_source: string | null
          description_5th_grade: string | null
          difficulty_level: string | null
          display_order: number | null
          estimated_minutes: number | null
          focus_area_ids: string | null
          fts: unknown
          is_active: string | null
          is_featured: string | null
          journey_id: string | null
          last_updated: string | null
          module_count: number | null
          path_description: string | null
          path_id: string
          path_name: string
          prerequisite_path_id: string | null
          theme_id: string | null
        }
        Insert: {
          badge_id?: string | null
          data_source?: string | null
          description_5th_grade?: string | null
          difficulty_level?: string | null
          display_order?: number | null
          estimated_minutes?: number | null
          focus_area_ids?: string | null
          fts?: unknown
          is_active?: string | null
          is_featured?: string | null
          journey_id?: string | null
          last_updated?: string | null
          module_count?: number | null
          path_description?: string | null
          path_id: string
          path_name: string
          prerequisite_path_id?: string | null
          theme_id?: string | null
        }
        Update: {
          badge_id?: string | null
          data_source?: string | null
          description_5th_grade?: string | null
          difficulty_level?: string | null
          display_order?: number | null
          estimated_minutes?: number | null
          focus_area_ids?: string | null
          fts?: unknown
          is_active?: string | null
          is_featured?: string | null
          journey_id?: string | null
          last_updated?: string | null
          module_count?: number | null
          path_description?: string | null
          path_id?: string
          path_name?: string
          prerequisite_path_id?: string | null
          theme_id?: string | null
        }
        Relationships: []
      }
      life_situation_focus_areas: {
        Row: {
          focus_id: string
          situation_id: string
        }
        Insert: {
          focus_id: string
          situation_id: string
        }
        Update: {
          focus_id?: string
          situation_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "life_situation_focus_areas_focus_id_fkey"
            columns: ["focus_id"]
            isOneToOne: false
            referencedRelation: "focus_areas"
            referencedColumns: ["focus_id"]
          },
          {
            foreignKeyName: "life_situation_focus_areas_situation_id_fkey"
            columns: ["situation_id"]
            isOneToOne: false
            referencedRelation: "life_situations"
            referencedColumns: ["situation_id"]
          },
        ]
      }
      life_situation_service_categories: {
        Row: {
          service_cat_id: string
          situation_id: string
        }
        Insert: {
          service_cat_id: string
          situation_id: string
        }
        Update: {
          service_cat_id?: string
          situation_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "life_situation_service_categories_service_cat_id_fkey"
            columns: ["service_cat_id"]
            isOneToOne: false
            referencedRelation: "service_categories"
            referencedColumns: ["service_cat_id"]
          },
          {
            foreignKeyName: "life_situation_service_categories_situation_id_fkey"
            columns: ["situation_id"]
            isOneToOne: false
            referencedRelation: "life_situations"
            referencedColumns: ["situation_id"]
          },
        ]
      }
      life_situations: {
        Row: {
          agency_ids: string | null
          benefit_ids: string | null
          color: string | null
          data_source: string | null
          description_5th_grade: string | null
          display_order: number | null
          focus_area_ids: string | null
          fts: unknown
          icon_name: string | null
          is_featured: string | null
          last_updated: string | null
          path_id: string | null
          resource_ids: string | null
          service_cat_ids: string | null
          situation_id: string
          situation_name: string
          situation_slug: string | null
          theme_id: string | null
          urgency_level: string | null
        }
        Insert: {
          agency_ids?: string | null
          benefit_ids?: string | null
          color?: string | null
          data_source?: string | null
          description_5th_grade?: string | null
          display_order?: number | null
          focus_area_ids?: string | null
          fts?: unknown
          icon_name?: string | null
          is_featured?: string | null
          last_updated?: string | null
          path_id?: string | null
          resource_ids?: string | null
          service_cat_ids?: string | null
          situation_id: string
          situation_name: string
          situation_slug?: string | null
          theme_id?: string | null
          urgency_level?: string | null
        }
        Update: {
          agency_ids?: string | null
          benefit_ids?: string | null
          color?: string | null
          data_source?: string | null
          description_5th_grade?: string | null
          display_order?: number | null
          focus_area_ids?: string | null
          fts?: unknown
          icon_name?: string | null
          is_featured?: string | null
          last_updated?: string | null
          path_id?: string | null
          resource_ids?: string | null
          service_cat_ids?: string | null
          situation_id?: string
          situation_name?: string
          situation_slug?: string | null
          theme_id?: string | null
          urgency_level?: string | null
        }
        Relationships: []
      }
      municipal_services: {
        Row: {
          address: string | null
          city: string | null
          county_id: string | null
          coverage_area: string | null
          display_order: number | null
          hours: string | null
          id: string
          is_emergency: boolean | null
          latitude: number | null
          longitude: number | null
          phone: string | null
          service_name: string
          service_type: string
          website: string | null
          zip_code: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          county_id?: string | null
          coverage_area?: string | null
          display_order?: number | null
          hours?: string | null
          id?: string
          is_emergency?: boolean | null
          latitude?: number | null
          longitude?: number | null
          phone?: string | null
          service_name: string
          service_type: string
          website?: string | null
          zip_code?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          county_id?: string | null
          coverage_area?: string | null
          display_order?: number | null
          hours?: string | null
          id?: string
          is_emergency?: boolean | null
          latitude?: number | null
          longitude?: number | null
          phone?: string | null
          service_name?: string
          service_type?: string
          website?: string | null
          zip_code?: string | null
        }
        Relationships: []
      }
      neighborhood_zip_codes: {
        Row: {
          neighborhood_id: string
          zip_code: string
        }
        Insert: {
          neighborhood_id: string
          zip_code: string
        }
        Update: {
          neighborhood_id?: string
          zip_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "neighborhood_zip_codes_neighborhood_id_fkey"
            columns: ["neighborhood_id"]
            isOneToOne: false
            referencedRelation: "neighborhoods"
            referencedColumns: ["neighborhood_id"]
          },
        ]
      }
      neighborhoods: {
        Row: {
          city: string | null
          council_district: string | null
          county_id: string | null
          data_source: string | null
          description: string | null
          is_active: string | null
          last_updated: string | null
          median_income: number | null
          neighborhood_id: string
          neighborhood_name: string
          neighborhood_type: string | null
          population: number | null
          super_neighborhood_id: string | null
          website: string | null
          zip_codes: string | null
        }
        Insert: {
          city?: string | null
          council_district?: string | null
          county_id?: string | null
          data_source?: string | null
          description?: string | null
          is_active?: string | null
          last_updated?: string | null
          median_income?: number | null
          neighborhood_id: string
          neighborhood_name: string
          neighborhood_type?: string | null
          population?: number | null
          super_neighborhood_id?: string | null
          website?: string | null
          zip_codes?: string | null
        }
        Update: {
          city?: string | null
          council_district?: string | null
          county_id?: string | null
          data_source?: string | null
          description?: string | null
          is_active?: string | null
          last_updated?: string | null
          median_income?: number | null
          neighborhood_id?: string
          neighborhood_name?: string
          neighborhood_type?: string | null
          population?: number | null
          super_neighborhood_id?: string | null
          website?: string | null
          zip_codes?: string | null
        }
        Relationships: []
      }
      notification_templates: {
        Row: {
          body_template: string | null
          calendar_id: string | null
          campaign_id: string | null
          channel: string | null
          cta_id: string | null
          data_source: string | null
          focus_area_ids: string | null
          is_active: string | null
          language_id: string | null
          last_updated: string | null
          notification_type: string | null
          subject_line: string | null
          template_id: string
          template_name: string
          trigger_event: string | null
          trigger_timing: string | null
        }
        Insert: {
          body_template?: string | null
          calendar_id?: string | null
          campaign_id?: string | null
          channel?: string | null
          cta_id?: string | null
          data_source?: string | null
          focus_area_ids?: string | null
          is_active?: string | null
          language_id?: string | null
          last_updated?: string | null
          notification_type?: string | null
          subject_line?: string | null
          template_id: string
          template_name: string
          trigger_event?: string | null
          trigger_timing?: string | null
        }
        Update: {
          body_template?: string | null
          calendar_id?: string | null
          campaign_id?: string | null
          channel?: string | null
          cta_id?: string | null
          data_source?: string | null
          focus_area_ids?: string | null
          is_active?: string | null
          language_id?: string | null
          last_updated?: string | null
          notification_type?: string | null
          subject_line?: string | null
          template_id?: string
          template_name?: string
          trigger_event?: string | null
          trigger_timing?: string | null
        }
        Relationships: []
      }
      ntee_codes: {
        Row: {
          ntee_code: string
          ntee_description: string | null
          ntee_name: string
        }
        Insert: {
          ntee_code: string
          ntee_description?: string | null
          ntee_name: string
        }
        Update: {
          ntee_code?: string
          ntee_description?: string | null
          ntee_name?: string
        }
        Relationships: []
      }
      official_aliases: {
        Row: {
          alias_id: string
          canonical_id: string
          created_at: string | null
          data_source: string | null
        }
        Insert: {
          alias_id: string
          canonical_id: string
          created_at?: string | null
          data_source?: string | null
        }
        Update: {
          alias_id?: string
          canonical_id?: string
          created_at?: string | null
          data_source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "official_aliases_canonical_id_fkey"
            columns: ["canonical_id"]
            isOneToOne: false
            referencedRelation: "elected_officials"
            referencedColumns: ["official_id"]
          },
          {
            foreignKeyName: "official_aliases_canonical_id_fkey"
            columns: ["canonical_id"]
            isOneToOne: false
            referencedRelation: "officials_braided"
            referencedColumns: ["official_id"]
          },
        ]
      }
      official_audience_segments: {
        Row: {
          official_id: string
          segment_id: string
        }
        Insert: {
          official_id: string
          segment_id: string
        }
        Update: {
          official_id?: string
          segment_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "official_audience_segments_official_id_fkey"
            columns: ["official_id"]
            isOneToOne: false
            referencedRelation: "elected_officials"
            referencedColumns: ["official_id"]
          },
          {
            foreignKeyName: "official_audience_segments_official_id_fkey"
            columns: ["official_id"]
            isOneToOne: false
            referencedRelation: "officials_braided"
            referencedColumns: ["official_id"]
          },
          {
            foreignKeyName: "official_audience_segments_segment_id_fkey"
            columns: ["segment_id"]
            isOneToOne: false
            referencedRelation: "audience_segments"
            referencedColumns: ["segment_id"]
          },
        ]
      }
      official_counties: {
        Row: {
          county_id: string
          official_id: string
        }
        Insert: {
          county_id: string
          official_id: string
        }
        Update: {
          county_id?: string
          official_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "official_counties_county_id_fkey"
            columns: ["county_id"]
            isOneToOne: false
            referencedRelation: "counties"
            referencedColumns: ["county_id"]
          },
          {
            foreignKeyName: "official_counties_official_id_fkey"
            columns: ["official_id"]
            isOneToOne: false
            referencedRelation: "elected_officials"
            referencedColumns: ["official_id"]
          },
          {
            foreignKeyName: "official_counties_official_id_fkey"
            columns: ["official_id"]
            isOneToOne: false
            referencedRelation: "officials_braided"
            referencedColumns: ["official_id"]
          },
        ]
      }
      official_focus_areas: {
        Row: {
          focus_id: string
          official_id: string
        }
        Insert: {
          focus_id: string
          official_id: string
        }
        Update: {
          focus_id?: string
          official_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "official_focus_areas_focus_id_fkey"
            columns: ["focus_id"]
            isOneToOne: false
            referencedRelation: "focus_areas"
            referencedColumns: ["focus_id"]
          },
          {
            foreignKeyName: "official_focus_areas_official_id_fkey"
            columns: ["official_id"]
            isOneToOne: false
            referencedRelation: "elected_officials"
            referencedColumns: ["official_id"]
          },
          {
            foreignKeyName: "official_focus_areas_official_id_fkey"
            columns: ["official_id"]
            isOneToOne: false
            referencedRelation: "officials_braided"
            referencedColumns: ["official_id"]
          },
        ]
      }
      official_pathways: {
        Row: {
          is_primary: boolean
          official_id: string
          theme_id: string
        }
        Insert: {
          is_primary?: boolean
          official_id: string
          theme_id: string
        }
        Update: {
          is_primary?: boolean
          official_id?: string
          theme_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "official_pathways_official_id_fkey"
            columns: ["official_id"]
            isOneToOne: false
            referencedRelation: "elected_officials"
            referencedColumns: ["official_id"]
          },
          {
            foreignKeyName: "official_pathways_official_id_fkey"
            columns: ["official_id"]
            isOneToOne: false
            referencedRelation: "officials_braided"
            referencedColumns: ["official_id"]
          },
          {
            foreignKeyName: "official_pathways_theme_id_fkey"
            columns: ["theme_id"]
            isOneToOne: false
            referencedRelation: "themes"
            referencedColumns: ["theme_id"]
          },
        ]
      }
      official_profiles: {
        Row: {
          address_district: string | null
          address_office: string | null
          bio_full: string | null
          bio_short: string | null
          data_source: string | null
          education: string | null
          email: string | null
          last_updated: string | null
          linkedin_status: string | null
          next_election: string | null
          official_id: string
          phone_district: string | null
          phone_office: string | null
          photo_url: string | null
          prior_roles: string | null
          social_facebook: string | null
          social_instagram: string | null
          social_linkedin: string | null
          social_twitter: string | null
          years_in_office: number | null
        }
        Insert: {
          address_district?: string | null
          address_office?: string | null
          bio_full?: string | null
          bio_short?: string | null
          data_source?: string | null
          education?: string | null
          email?: string | null
          last_updated?: string | null
          linkedin_status?: string | null
          next_election?: string | null
          official_id: string
          phone_district?: string | null
          phone_office?: string | null
          photo_url?: string | null
          prior_roles?: string | null
          social_facebook?: string | null
          social_instagram?: string | null
          social_linkedin?: string | null
          social_twitter?: string | null
          years_in_office?: number | null
        }
        Update: {
          address_district?: string | null
          address_office?: string | null
          bio_full?: string | null
          bio_short?: string | null
          data_source?: string | null
          education?: string | null
          email?: string | null
          last_updated?: string | null
          linkedin_status?: string | null
          next_election?: string | null
          official_id?: string
          phone_district?: string | null
          phone_office?: string | null
          photo_url?: string | null
          prior_roles?: string | null
          social_facebook?: string | null
          social_instagram?: string | null
          social_linkedin?: string | null
          social_twitter?: string | null
          years_in_office?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "official_profiles_official_id_fkey"
            columns: ["official_id"]
            isOneToOne: true
            referencedRelation: "elected_officials"
            referencedColumns: ["official_id"]
          },
          {
            foreignKeyName: "official_profiles_official_id_fkey"
            columns: ["official_id"]
            isOneToOne: true
            referencedRelation: "officials_braided"
            referencedColumns: ["official_id"]
          },
        ]
      }
      official_sdgs: {
        Row: {
          official_id: string
          sdg_id: string
        }
        Insert: {
          official_id: string
          sdg_id: string
        }
        Update: {
          official_id?: string
          sdg_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "official_sdgs_official_id_fkey"
            columns: ["official_id"]
            isOneToOne: false
            referencedRelation: "elected_officials"
            referencedColumns: ["official_id"]
          },
          {
            foreignKeyName: "official_sdgs_official_id_fkey"
            columns: ["official_id"]
            isOneToOne: false
            referencedRelation: "officials_braided"
            referencedColumns: ["official_id"]
          },
          {
            foreignKeyName: "official_sdgs_sdg_id_fkey"
            columns: ["sdg_id"]
            isOneToOne: false
            referencedRelation: "sdgs"
            referencedColumns: ["sdg_id"]
          },
        ]
      }
      opportunities: {
        Row: {
          action_type_id: string | null
          address: string | null
          city: string | null
          classification_v2: Json | null
          county_id: string | null
          created_by: string | null
          data_source: string | null
          description_5th_grade: string | null
          end_date: string | null
          focus_area_ids: string | null
          fts: unknown
          is_active: string | null
          is_virtual: string | null
          last_updated: string | null
          min_age: number | null
          opportunity_id: string
          opportunity_name: string
          org_id: string | null
          registration_url: string | null
          review_status: string | null
          skill_ids: string | null
          spots_available: number | null
          start_date: string | null
          state: string | null
          time_commitment_id: string | null
          zip_code: string | null
        }
        Insert: {
          action_type_id?: string | null
          address?: string | null
          city?: string | null
          classification_v2?: Json | null
          county_id?: string | null
          created_by?: string | null
          data_source?: string | null
          description_5th_grade?: string | null
          end_date?: string | null
          focus_area_ids?: string | null
          fts?: unknown
          is_active?: string | null
          is_virtual?: string | null
          last_updated?: string | null
          min_age?: number | null
          opportunity_id: string
          opportunity_name: string
          org_id?: string | null
          registration_url?: string | null
          review_status?: string | null
          skill_ids?: string | null
          spots_available?: number | null
          start_date?: string | null
          state?: string | null
          time_commitment_id?: string | null
          zip_code?: string | null
        }
        Update: {
          action_type_id?: string | null
          address?: string | null
          city?: string | null
          classification_v2?: Json | null
          county_id?: string | null
          created_by?: string | null
          data_source?: string | null
          description_5th_grade?: string | null
          end_date?: string | null
          focus_area_ids?: string | null
          fts?: unknown
          is_active?: string | null
          is_virtual?: string | null
          last_updated?: string | null
          min_age?: number | null
          opportunity_id?: string
          opportunity_name?: string
          org_id?: string | null
          registration_url?: string | null
          review_status?: string | null
          skill_ids?: string | null
          spots_available?: number | null
          start_date?: string | null
          state?: string | null
          time_commitment_id?: string | null
          zip_code?: string | null
        }
        Relationships: []
      }
      opportunity_action_types: {
        Row: {
          action_type_id: string
          opportunity_id: string
        }
        Insert: {
          action_type_id: string
          opportunity_id: string
        }
        Update: {
          action_type_id?: string
          opportunity_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "opportunity_action_types_action_type_id_fkey"
            columns: ["action_type_id"]
            isOneToOne: false
            referencedRelation: "action_types"
            referencedColumns: ["action_type_id"]
          },
          {
            foreignKeyName: "opportunity_action_types_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["opportunity_id"]
          },
        ]
      }
      opportunity_audience_segments: {
        Row: {
          opportunity_id: string
          segment_id: string
        }
        Insert: {
          opportunity_id: string
          segment_id: string
        }
        Update: {
          opportunity_id?: string
          segment_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "opportunity_audience_segments_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["opportunity_id"]
          },
          {
            foreignKeyName: "opportunity_audience_segments_segment_id_fkey"
            columns: ["segment_id"]
            isOneToOne: false
            referencedRelation: "audience_segments"
            referencedColumns: ["segment_id"]
          },
        ]
      }
      opportunity_focus_areas: {
        Row: {
          focus_id: string
          opportunity_id: string
        }
        Insert: {
          focus_id: string
          opportunity_id: string
        }
        Update: {
          focus_id?: string
          opportunity_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "opportunity_focus_areas_focus_id_fkey"
            columns: ["focus_id"]
            isOneToOne: false
            referencedRelation: "focus_areas"
            referencedColumns: ["focus_id"]
          },
          {
            foreignKeyName: "opportunity_focus_areas_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["opportunity_id"]
          },
        ]
      }
      opportunity_life_situations: {
        Row: {
          opportunity_id: string
          situation_id: string
        }
        Insert: {
          opportunity_id: string
          situation_id: string
        }
        Update: {
          opportunity_id?: string
          situation_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "opportunity_life_situations_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["opportunity_id"]
          },
          {
            foreignKeyName: "opportunity_life_situations_situation_id_fkey"
            columns: ["situation_id"]
            isOneToOne: false
            referencedRelation: "life_situations"
            referencedColumns: ["situation_id"]
          },
        ]
      }
      opportunity_pathways: {
        Row: {
          is_primary: boolean
          opportunity_id: string
          theme_id: string
        }
        Insert: {
          is_primary?: boolean
          opportunity_id: string
          theme_id: string
        }
        Update: {
          is_primary?: boolean
          opportunity_id?: string
          theme_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "opportunity_pathways_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["opportunity_id"]
          },
          {
            foreignKeyName: "opportunity_pathways_theme_id_fkey"
            columns: ["theme_id"]
            isOneToOne: false
            referencedRelation: "themes"
            referencedColumns: ["theme_id"]
          },
        ]
      }
      opportunity_sdgs: {
        Row: {
          opportunity_id: string
          sdg_id: string
        }
        Insert: {
          opportunity_id: string
          sdg_id: string
        }
        Update: {
          opportunity_id?: string
          sdg_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "opportunity_sdgs_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["opportunity_id"]
          },
          {
            foreignKeyName: "opportunity_sdgs_sdg_id_fkey"
            columns: ["sdg_id"]
            isOneToOne: false
            referencedRelation: "sdgs"
            referencedColumns: ["sdg_id"]
          },
        ]
      }
      org_domains: {
        Row: {
          created_at: string | null
          domain: string
          id: string
          org_id: string
        }
        Insert: {
          created_at?: string | null
          domain: string
          id?: string
          org_id: string
        }
        Update: {
          created_at?: string | null
          domain?: string
          id?: string
          org_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "org_domains_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["org_id"]
          },
        ]
      }
      organization_audience_segments: {
        Row: {
          org_id: string
          segment_id: string
        }
        Insert: {
          org_id: string
          segment_id: string
        }
        Update: {
          org_id?: string
          segment_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_audience_segments_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "organization_audience_segments_segment_id_fkey"
            columns: ["segment_id"]
            isOneToOne: false
            referencedRelation: "audience_segments"
            referencedColumns: ["segment_id"]
          },
        ]
      }
      organization_focus_areas: {
        Row: {
          focus_id: string
          org_id: string
        }
        Insert: {
          focus_id: string
          org_id: string
        }
        Update: {
          focus_id?: string
          org_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_focus_areas_focus_id_fkey"
            columns: ["focus_id"]
            isOneToOne: false
            referencedRelation: "focus_areas"
            referencedColumns: ["focus_id"]
          },
          {
            foreignKeyName: "organization_focus_areas_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["org_id"]
          },
        ]
      }
      organization_life_situations: {
        Row: {
          org_id: string
          situation_id: string
        }
        Insert: {
          org_id: string
          situation_id: string
        }
        Update: {
          org_id?: string
          situation_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_life_situations_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "organization_life_situations_situation_id_fkey"
            columns: ["situation_id"]
            isOneToOne: false
            referencedRelation: "life_situations"
            referencedColumns: ["situation_id"]
          },
        ]
      }
      organization_neighborhoods: {
        Row: {
          neighborhood_id: string
          org_id: string
        }
        Insert: {
          neighborhood_id: string
          org_id: string
        }
        Update: {
          neighborhood_id?: string
          org_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_neighborhoods_neighborhood_id_fkey"
            columns: ["neighborhood_id"]
            isOneToOne: false
            referencedRelation: "neighborhoods"
            referencedColumns: ["neighborhood_id"]
          },
          {
            foreignKeyName: "organization_neighborhoods_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["org_id"]
          },
        ]
      }
      organization_pathways: {
        Row: {
          is_primary: boolean
          org_id: string
          theme_id: string
        }
        Insert: {
          is_primary?: boolean
          org_id: string
          theme_id: string
        }
        Update: {
          is_primary?: boolean
          org_id?: string
          theme_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_pathways_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "organization_pathways_theme_id_fkey"
            columns: ["theme_id"]
            isOneToOne: false
            referencedRelation: "themes"
            referencedColumns: ["theme_id"]
          },
        ]
      }
      organization_sdgs: {
        Row: {
          org_id: string
          sdg_id: string
        }
        Insert: {
          org_id: string
          sdg_id: string
        }
        Update: {
          org_id?: string
          sdg_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_sdgs_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "organization_sdgs_sdg_id_fkey"
            columns: ["sdg_id"]
            isOneToOne: false
            referencedRelation: "sdgs"
            referencedColumns: ["sdg_id"]
          },
        ]
      }
      organization_service_categories: {
        Row: {
          org_id: string
          service_cat_id: string
        }
        Insert: {
          org_id: string
          service_cat_id: string
        }
        Update: {
          org_id?: string
          service_cat_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_service_categories_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "organization_service_categories_service_cat_id_fkey"
            columns: ["service_cat_id"]
            isOneToOne: false
            referencedRelation: "service_categories"
            referencedColumns: ["service_cat_id"]
          },
        ]
      }
      organizations: {
        Row: {
          address: string | null
          annual_budget: number | null
          app_store_url: string | null
          city: string | null
          classification_v2: Json | null
          county_id: string | null
          data_feeds: Json | null
          data_source: string | null
          description_5th_grade: string | null
          description_full: string | null
          ein: string | null
          email: string | null
          focus_area_ids: string | null
          fts: unknown
          google_play_url: string | null
          hero_image_url: string | null
          hours_of_operation: Json | null
          irs_subsection: string | null
          is_verified: string | null
          last_updated: string | null
          latitude: number | null
          logo_url: string | null
          longitude: number | null
          map_link: string | null
          mission_statement: string | null
          ntee_code: string | null
          org_id: string
          org_name: string
          org_type: string | null
          partner_count: number | null
          people_served: string | null
          phone: string | null
          phone_secondary: string | null
          service_area: string | null
          social_media: Json | null
          state: string | null
          tags: string[] | null
          website: string | null
          year_founded: number | null
          zip_code: string | null
        }
        Insert: {
          address?: string | null
          annual_budget?: number | null
          app_store_url?: string | null
          city?: string | null
          classification_v2?: Json | null
          county_id?: string | null
          data_feeds?: Json | null
          data_source?: string | null
          description_5th_grade?: string | null
          description_full?: string | null
          ein?: string | null
          email?: string | null
          focus_area_ids?: string | null
          fts?: unknown
          google_play_url?: string | null
          hero_image_url?: string | null
          hours_of_operation?: Json | null
          irs_subsection?: string | null
          is_verified?: string | null
          last_updated?: string | null
          latitude?: number | null
          logo_url?: string | null
          longitude?: number | null
          map_link?: string | null
          mission_statement?: string | null
          ntee_code?: string | null
          org_id: string
          org_name: string
          org_type?: string | null
          partner_count?: number | null
          people_served?: string | null
          phone?: string | null
          phone_secondary?: string | null
          service_area?: string | null
          social_media?: Json | null
          state?: string | null
          tags?: string[] | null
          website?: string | null
          year_founded?: number | null
          zip_code?: string | null
        }
        Update: {
          address?: string | null
          annual_budget?: number | null
          app_store_url?: string | null
          city?: string | null
          classification_v2?: Json | null
          county_id?: string | null
          data_feeds?: Json | null
          data_source?: string | null
          description_5th_grade?: string | null
          description_full?: string | null
          ein?: string | null
          email?: string | null
          focus_area_ids?: string | null
          fts?: unknown
          google_play_url?: string | null
          hero_image_url?: string | null
          hours_of_operation?: Json | null
          irs_subsection?: string | null
          is_verified?: string | null
          last_updated?: string | null
          latitude?: number | null
          logo_url?: string | null
          longitude?: number | null
          map_link?: string | null
          mission_statement?: string | null
          ntee_code?: string | null
          org_id?: string
          org_name?: string
          org_type?: string | null
          partner_count?: number | null
          people_served?: string | null
          phone?: string | null
          phone_secondary?: string | null
          service_area?: string | null
          social_media?: Json | null
          state?: string | null
          tags?: string[] | null
          website?: string | null
          year_founded?: number | null
          zip_code?: string | null
        }
        Relationships: []
      }
      policies: {
        Row: {
          bill_number: string | null
          classification_v2: Json | null
          data_source: string | null
          focus_area_ids: string | null
          fts: unknown
          impact_statement: string | null
          introduced_date: string | null
          is_published: boolean | null
          last_action: string | null
          last_action_date: string | null
          last_updated: string | null
          level: string | null
          official_ids: string | null
          policy_id: string
          policy_name: string
          policy_type: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          source_url: string | null
          status: string | null
          summary_5th_grade: string | null
          summary_6th_grade: string | null
          title_6th_grade: string | null
        }
        Insert: {
          bill_number?: string | null
          classification_v2?: Json | null
          data_source?: string | null
          focus_area_ids?: string | null
          fts?: unknown
          impact_statement?: string | null
          introduced_date?: string | null
          is_published?: boolean | null
          last_action?: string | null
          last_action_date?: string | null
          last_updated?: string | null
          level?: string | null
          official_ids?: string | null
          policy_id: string
          policy_name: string
          policy_type?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          source_url?: string | null
          status?: string | null
          summary_5th_grade?: string | null
          summary_6th_grade?: string | null
          title_6th_grade?: string | null
        }
        Update: {
          bill_number?: string | null
          classification_v2?: Json | null
          data_source?: string | null
          focus_area_ids?: string | null
          fts?: unknown
          impact_statement?: string | null
          introduced_date?: string | null
          is_published?: boolean | null
          last_action?: string | null
          last_action_date?: string | null
          last_updated?: string | null
          level?: string | null
          official_ids?: string | null
          policy_id?: string
          policy_name?: string
          policy_type?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          source_url?: string | null
          status?: string | null
          summary_5th_grade?: string | null
          summary_6th_grade?: string | null
          title_6th_grade?: string | null
        }
        Relationships: []
      }
      policy_audience_segments: {
        Row: {
          policy_id: string
          segment_id: string
        }
        Insert: {
          policy_id: string
          segment_id: string
        }
        Update: {
          policy_id?: string
          segment_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "policy_audience_segments_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "policies"
            referencedColumns: ["policy_id"]
          },
          {
            foreignKeyName: "policy_audience_segments_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "policies_braided"
            referencedColumns: ["policy_id"]
          },
          {
            foreignKeyName: "policy_audience_segments_segment_id_fkey"
            columns: ["segment_id"]
            isOneToOne: false
            referencedRelation: "audience_segments"
            referencedColumns: ["segment_id"]
          },
        ]
      }
      policy_focus_areas: {
        Row: {
          focus_id: string
          policy_id: string
        }
        Insert: {
          focus_id: string
          policy_id: string
        }
        Update: {
          focus_id?: string
          policy_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "policy_focus_areas_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "policies"
            referencedColumns: ["policy_id"]
          },
          {
            foreignKeyName: "policy_focus_areas_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "policies_braided"
            referencedColumns: ["policy_id"]
          },
        ]
      }
      policy_geography: {
        Row: {
          geo_id: string
          geo_type: string
          id: string
          policy_id: string
        }
        Insert: {
          geo_id: string
          geo_type: string
          id?: string
          policy_id: string
        }
        Update: {
          geo_id?: string
          geo_type?: string
          id?: string
          policy_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "policy_geography_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "policies"
            referencedColumns: ["policy_id"]
          },
          {
            foreignKeyName: "policy_geography_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "policies_braided"
            referencedColumns: ["policy_id"]
          },
        ]
      }
      policy_life_situations: {
        Row: {
          policy_id: string
          situation_id: string
        }
        Insert: {
          policy_id: string
          situation_id: string
        }
        Update: {
          policy_id?: string
          situation_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "policy_life_situations_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "policies"
            referencedColumns: ["policy_id"]
          },
          {
            foreignKeyName: "policy_life_situations_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "policies_braided"
            referencedColumns: ["policy_id"]
          },
          {
            foreignKeyName: "policy_life_situations_situation_id_fkey"
            columns: ["situation_id"]
            isOneToOne: false
            referencedRelation: "life_situations"
            referencedColumns: ["situation_id"]
          },
        ]
      }
      policy_officials: {
        Row: {
          official_id: string
          policy_id: string
        }
        Insert: {
          official_id: string
          policy_id: string
        }
        Update: {
          official_id?: string
          policy_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "policy_officials_official_id_fkey"
            columns: ["official_id"]
            isOneToOne: false
            referencedRelation: "elected_officials"
            referencedColumns: ["official_id"]
          },
          {
            foreignKeyName: "policy_officials_official_id_fkey"
            columns: ["official_id"]
            isOneToOne: false
            referencedRelation: "officials_braided"
            referencedColumns: ["official_id"]
          },
          {
            foreignKeyName: "policy_officials_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "policies"
            referencedColumns: ["policy_id"]
          },
          {
            foreignKeyName: "policy_officials_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "policies_braided"
            referencedColumns: ["policy_id"]
          },
        ]
      }
      policy_pathways: {
        Row: {
          is_primary: boolean
          policy_id: string
          theme_id: string
        }
        Insert: {
          is_primary?: boolean
          policy_id: string
          theme_id: string
        }
        Update: {
          is_primary?: boolean
          policy_id?: string
          theme_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "policy_pathways_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "policies"
            referencedColumns: ["policy_id"]
          },
          {
            foreignKeyName: "policy_pathways_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "policies_braided"
            referencedColumns: ["policy_id"]
          },
          {
            foreignKeyName: "policy_pathways_theme_id_fkey"
            columns: ["theme_id"]
            isOneToOne: false
            referencedRelation: "themes"
            referencedColumns: ["theme_id"]
          },
        ]
      }
      policy_sdgs: {
        Row: {
          policy_id: string
          sdg_id: string
        }
        Insert: {
          policy_id: string
          sdg_id: string
        }
        Update: {
          policy_id?: string
          sdg_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "policy_sdgs_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "policies"
            referencedColumns: ["policy_id"]
          },
          {
            foreignKeyName: "policy_sdgs_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "policies_braided"
            referencedColumns: ["policy_id"]
          },
          {
            foreignKeyName: "policy_sdgs_sdg_id_fkey"
            columns: ["sdg_id"]
            isOneToOne: false
            referencedRelation: "sdgs"
            referencedColumns: ["sdg_id"]
          },
        ]
      }
      precinct_neighborhoods: {
        Row: {
          neighborhood_id: string
          precinct_id: string
        }
        Insert: {
          neighborhood_id: string
          precinct_id: string
        }
        Update: {
          neighborhood_id?: string
          precinct_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "precinct_neighborhoods_neighborhood_id_fkey"
            columns: ["neighborhood_id"]
            isOneToOne: false
            referencedRelation: "neighborhoods"
            referencedColumns: ["neighborhood_id"]
          },
          {
            foreignKeyName: "precinct_neighborhoods_precinct_id_fkey"
            columns: ["precinct_id"]
            isOneToOne: false
            referencedRelation: "precincts"
            referencedColumns: ["precinct_id"]
          },
        ]
      }
      precincts: {
        Row: {
          commissioner_precinct: number | null
          congressional_district: string | null
          council_district: string | null
          county_id: string | null
          data_source: string | null
          is_active: string | null
          last_updated: string | null
          neighborhood_ids: string | null
          precinct_id: string
          precinct_number: number | null
          precinct_type: string | null
          registered_voters: number | null
          state_house_district: string | null
          state_senate_district: string | null
          tract_ids: string | null
          voting_location_ids: string | null
          zip_codes: string | null
        }
        Insert: {
          commissioner_precinct?: number | null
          congressional_district?: string | null
          council_district?: string | null
          county_id?: string | null
          data_source?: string | null
          is_active?: string | null
          last_updated?: string | null
          neighborhood_ids?: string | null
          precinct_id: string
          precinct_number?: number | null
          precinct_type?: string | null
          registered_voters?: number | null
          state_house_district?: string | null
          state_senate_district?: string | null
          tract_ids?: string | null
          voting_location_ids?: string | null
          zip_codes?: string | null
        }
        Update: {
          commissioner_precinct?: number | null
          congressional_district?: string | null
          council_district?: string | null
          county_id?: string | null
          data_source?: string | null
          is_active?: string | null
          last_updated?: string | null
          neighborhood_ids?: string | null
          precinct_id?: string
          precinct_number?: number | null
          precinct_type?: string | null
          registered_voters?: number | null
          state_house_district?: string | null
          state_senate_district?: string | null
          tract_ids?: string | null
          voting_location_ids?: string | null
          zip_codes?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          badge_ids: string[] | null
          created_at: string | null
          display_name: string | null
          id: string
          interests: string[] | null
          neighborhood_id: string | null
          role: string
          updated_at: string | null
          zip_code: string | null
        }
        Insert: {
          badge_ids?: string[] | null
          created_at?: string | null
          display_name?: string | null
          id: string
          interests?: string[] | null
          neighborhood_id?: string | null
          role?: string
          updated_at?: string | null
          zip_code?: string | null
        }
        Update: {
          badge_ids?: string[] | null
          created_at?: string | null
          display_name?: string | null
          id?: string
          interests?: string[] | null
          neighborhood_id?: string | null
          role?: string
          updated_at?: string | null
          zip_code?: string | null
        }
        Relationships: []
      }
      quizzes: {
        Row: {
          data_source: string | null
          is_active: string | null
          is_required: string | null
          last_updated: string | null
          module_id: string | null
          passing_score: number | null
          question_count: number | null
          quiz_id: string
          quiz_name: string
          time_limit_minutes: number | null
        }
        Insert: {
          data_source?: string | null
          is_active?: string | null
          is_required?: string | null
          last_updated?: string | null
          module_id?: string | null
          passing_score?: number | null
          question_count?: number | null
          quiz_id: string
          quiz_name: string
          time_limit_minutes?: number | null
        }
        Update: {
          data_source?: string | null
          is_active?: string | null
          is_required?: string | null
          last_updated?: string | null
          module_id?: string | null
          passing_score?: number | null
          question_count?: number | null
          quiz_id?: string
          quiz_name?: string
          time_limit_minutes?: number | null
        }
        Relationships: []
      }
      resource_types: {
        Row: {
          center: string | null
          description_5th_grade: string | null
          format: string | null
          resource_type_id: string
          resource_type_name: string
        }
        Insert: {
          center?: string | null
          description_5th_grade?: string | null
          format?: string | null
          resource_type_id: string
          resource_type_name: string
        }
        Update: {
          center?: string | null
          description_5th_grade?: string | null
          format?: string | null
          resource_type_id?: string
          resource_type_name?: string
        }
        Relationships: []
      }
      resources: {
        Row: {
          classification_v2: Json | null
          content_format: string | null
          content_types: string | null
          data_source: string | null
          description_5th_grade: string | null
          engagement_levels: string | null
          estimated_minutes: number | null
          focus_area_ids: string | null
          fts: unknown
          image_url: string | null
          is_active: string | null
          is_community_partner: boolean | null
          is_featured: string | null
          journey_id: string | null
          language_ids: string | null
          last_updated: string | null
          location: string | null
          module_ids: string | null
          original_post_id: number | null
          path_ids: string | null
          publish_date: string | null
          reading_level: string | null
          resource_id: string
          resource_name: string
          resource_slug: string | null
          resource_type_id: string | null
          source_org: string | null
          source_url: string | null
        }
        Insert: {
          classification_v2?: Json | null
          content_format?: string | null
          content_types?: string | null
          data_source?: string | null
          description_5th_grade?: string | null
          engagement_levels?: string | null
          estimated_minutes?: number | null
          focus_area_ids?: string | null
          fts?: unknown
          image_url?: string | null
          is_active?: string | null
          is_community_partner?: boolean | null
          is_featured?: string | null
          journey_id?: string | null
          language_ids?: string | null
          last_updated?: string | null
          location?: string | null
          module_ids?: string | null
          original_post_id?: number | null
          path_ids?: string | null
          publish_date?: string | null
          reading_level?: string | null
          resource_id: string
          resource_name: string
          resource_slug?: string | null
          resource_type_id?: string | null
          source_org?: string | null
          source_url?: string | null
        }
        Update: {
          classification_v2?: Json | null
          content_format?: string | null
          content_types?: string | null
          data_source?: string | null
          description_5th_grade?: string | null
          engagement_levels?: string | null
          estimated_minutes?: number | null
          focus_area_ids?: string | null
          fts?: unknown
          image_url?: string | null
          is_active?: string | null
          is_community_partner?: boolean | null
          is_featured?: string | null
          journey_id?: string | null
          language_ids?: string | null
          last_updated?: string | null
          location?: string | null
          module_ids?: string | null
          original_post_id?: number | null
          path_ids?: string | null
          publish_date?: string | null
          reading_level?: string | null
          resource_id?: string
          resource_name?: string
          resource_slug?: string | null
          resource_type_id?: string | null
          source_org?: string | null
          source_url?: string | null
        }
        Relationships: []
      }
      rss_feeds: {
        Row: {
          created_at: string | null
          feed_name: string
          feed_url: string
          id: string
          is_active: boolean | null
          last_item_count: number | null
          last_polled: string | null
          poll_interval_hours: number | null
          source_domain: string | null
        }
        Insert: {
          created_at?: string | null
          feed_name: string
          feed_url: string
          id?: string
          is_active?: boolean | null
          last_item_count?: number | null
          last_polled?: string | null
          poll_interval_hours?: number | null
          source_domain?: string | null
        }
        Update: {
          created_at?: string | null
          feed_name?: string
          feed_url?: string
          id?: string
          is_active?: boolean | null
          last_item_count?: number | null
          last_polled?: string | null
          poll_interval_hours?: number | null
          source_domain?: string | null
        }
        Relationships: []
      }
      school_districts: {
        Row: {
          county_ids: string | null
          enrollment: number | null
          phone: string | null
          school_district_id: string
          school_district_name: string
          website: string | null
        }
        Insert: {
          county_ids?: string | null
          enrollment?: number | null
          phone?: string | null
          school_district_id: string
          school_district_name: string
          website?: string | null
        }
        Update: {
          county_ids?: string | null
          enrollment?: number | null
          phone?: string | null
          school_district_id?: string
          school_district_name?: string
          website?: string | null
        }
        Relationships: []
      }
      sdgs: {
        Row: {
          sdg_color: string | null
          sdg_id: string
          sdg_name: string
          sdg_number: number
        }
        Insert: {
          sdg_color?: string | null
          sdg_id: string
          sdg_name: string
          sdg_number: number
        }
        Update: {
          sdg_color?: string | null
          sdg_id?: string
          sdg_name?: string
          sdg_number?: number
        }
        Relationships: []
      }
      sdoh_domains: {
        Row: {
          sdoh_code: string
          sdoh_description: string | null
          sdoh_name: string
        }
        Insert: {
          sdoh_code: string
          sdoh_description?: string | null
          sdoh_name: string
        }
        Update: {
          sdoh_code?: string
          sdoh_description?: string | null
          sdoh_name?: string
        }
        Relationships: []
      }
      service_audience_segments: {
        Row: {
          segment_id: string
          service_id: string
        }
        Insert: {
          segment_id: string
          service_id: string
        }
        Update: {
          segment_id?: string
          service_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_audience_segments_segment_id_fkey"
            columns: ["segment_id"]
            isOneToOne: false
            referencedRelation: "audience_segments"
            referencedColumns: ["segment_id"]
          },
          {
            foreignKeyName: "service_audience_segments_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services_211"
            referencedColumns: ["service_id"]
          },
        ]
      }
      service_categories: {
        Row: {
          airs_codes: string | null
          description_5th_grade: string | null
          example_services: string | null
          service_cat_id: string
          service_cat_name: string
        }
        Insert: {
          airs_codes?: string | null
          description_5th_grade?: string | null
          example_services?: string | null
          service_cat_id: string
          service_cat_name: string
        }
        Update: {
          airs_codes?: string | null
          description_5th_grade?: string | null
          example_services?: string | null
          service_cat_id?: string
          service_cat_name?: string
        }
        Relationships: []
      }
      service_focus_areas: {
        Row: {
          focus_id: string
          service_id: string
        }
        Insert: {
          focus_id: string
          service_id: string
        }
        Update: {
          focus_id?: string
          service_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_focus_areas_focus_id_fkey"
            columns: ["focus_id"]
            isOneToOne: false
            referencedRelation: "focus_areas"
            referencedColumns: ["focus_id"]
          },
          {
            foreignKeyName: "service_focus_areas_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services_211"
            referencedColumns: ["service_id"]
          },
        ]
      }
      service_life_situations: {
        Row: {
          service_id: string
          situation_id: string
        }
        Insert: {
          service_id: string
          situation_id: string
        }
        Update: {
          service_id?: string
          situation_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_life_situations_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services_211"
            referencedColumns: ["service_id"]
          },
          {
            foreignKeyName: "service_life_situations_situation_id_fkey"
            columns: ["situation_id"]
            isOneToOne: false
            referencedRelation: "life_situations"
            referencedColumns: ["situation_id"]
          },
        ]
      }
      service_pathways: {
        Row: {
          is_primary: boolean
          service_id: string
          theme_id: string
        }
        Insert: {
          is_primary?: boolean
          service_id: string
          theme_id: string
        }
        Update: {
          is_primary?: boolean
          service_id?: string
          theme_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_pathways_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services_211"
            referencedColumns: ["service_id"]
          },
          {
            foreignKeyName: "service_pathways_theme_id_fkey"
            columns: ["theme_id"]
            isOneToOne: false
            referencedRelation: "themes"
            referencedColumns: ["theme_id"]
          },
        ]
      }
      service_sdgs: {
        Row: {
          sdg_id: string
          service_id: string
        }
        Insert: {
          sdg_id: string
          service_id: string
        }
        Update: {
          sdg_id?: string
          service_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_sdgs_sdg_id_fkey"
            columns: ["sdg_id"]
            isOneToOne: false
            referencedRelation: "sdgs"
            referencedColumns: ["sdg_id"]
          },
          {
            foreignKeyName: "service_sdgs_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services_211"
            referencedColumns: ["service_id"]
          },
        ]
      }
      services_211: {
        Row: {
          address: string | null
          airs_code: string | null
          city: string | null
          classification_v2: Json | null
          county_id: string | null
          data_source: string | null
          description_5th_grade: string | null
          eligibility: string | null
          fees: string | null
          focus_area_ids: string | null
          fts: unknown
          hours: string | null
          is_active: string | null
          languages: string | null
          last_updated: string | null
          org_id: string | null
          phone: string | null
          service_cat_id: string | null
          service_id: string
          service_name: string
          state: string | null
          website: string | null
          zip_code: string | null
        }
        Insert: {
          address?: string | null
          airs_code?: string | null
          city?: string | null
          classification_v2?: Json | null
          county_id?: string | null
          data_source?: string | null
          description_5th_grade?: string | null
          eligibility?: string | null
          fees?: string | null
          focus_area_ids?: string | null
          fts?: unknown
          hours?: string | null
          is_active?: string | null
          languages?: string | null
          last_updated?: string | null
          org_id?: string | null
          phone?: string | null
          service_cat_id?: string | null
          service_id: string
          service_name: string
          state?: string | null
          website?: string | null
          zip_code?: string | null
        }
        Update: {
          address?: string | null
          airs_code?: string | null
          city?: string | null
          classification_v2?: Json | null
          county_id?: string | null
          data_source?: string | null
          description_5th_grade?: string | null
          eligibility?: string | null
          fees?: string | null
          focus_area_ids?: string | null
          fts?: unknown
          hours?: string | null
          is_active?: string | null
          languages?: string | null
          last_updated?: string | null
          org_id?: string | null
          phone?: string | null
          service_cat_id?: string | null
          service_id?: string
          service_name?: string
          state?: string | null
          website?: string | null
          zip_code?: string | null
        }
        Relationships: []
      }
      skills: {
        Row: {
          description_5th_grade: string | null
          skill_category: string | null
          skill_id: string
          skill_name: string
        }
        Insert: {
          description_5th_grade?: string | null
          skill_category?: string | null
          skill_id: string
          skill_name: string
        }
        Update: {
          description_5th_grade?: string | null
          skill_category?: string | null
          skill_id?: string
          skill_name?: string
        }
        Relationships: []
      }
      source_trust: {
        Row: {
          auto_publish: boolean | null
          created_at: string | null
          domain: string
          id: string
          notes: string | null
          source_name: string | null
          trust_level: string | null
        }
        Insert: {
          auto_publish?: boolean | null
          created_at?: string | null
          domain: string
          id?: string
          notes?: string | null
          source_name?: string | null
          trust_level?: string | null
        }
        Update: {
          auto_publish?: boolean | null
          created_at?: string | null
          domain?: string
          id?: string
          notes?: string | null
          source_name?: string | null
          trust_level?: string | null
        }
        Relationships: []
      }
      success_stories: {
        Row: {
          action_types_used: string | null
          campaign_id: string | null
          data_source: string | null
          focus_area_ids: string | null
          full_story: string | null
          impact_description: string | null
          is_featured: string | null
          is_published: string | null
          last_updated: string | null
          path_id: string | null
          person_name: string | null
          person_neighborhood: string | null
          person_photo_url: string | null
          publish_date: string | null
          quote: string | null
          story_id: string
          story_slug: string | null
          story_summary: string | null
          story_title: string
          theme_id: string | null
        }
        Insert: {
          action_types_used?: string | null
          campaign_id?: string | null
          data_source?: string | null
          focus_area_ids?: string | null
          full_story?: string | null
          impact_description?: string | null
          is_featured?: string | null
          is_published?: string | null
          last_updated?: string | null
          path_id?: string | null
          person_name?: string | null
          person_neighborhood?: string | null
          person_photo_url?: string | null
          publish_date?: string | null
          quote?: string | null
          story_id: string
          story_slug?: string | null
          story_summary?: string | null
          story_title: string
          theme_id?: string | null
        }
        Update: {
          action_types_used?: string | null
          campaign_id?: string | null
          data_source?: string | null
          focus_area_ids?: string | null
          full_story?: string | null
          impact_description?: string | null
          is_featured?: string | null
          is_published?: string | null
          last_updated?: string | null
          path_id?: string | null
          person_name?: string | null
          person_neighborhood?: string | null
          person_photo_url?: string | null
          publish_date?: string | null
          quote?: string | null
          story_id?: string
          story_slug?: string | null
          story_summary?: string | null
          story_title?: string
          theme_id?: string | null
        }
        Relationships: []
      }
      super_neighborhoods: {
        Row: {
          council_districts: string | null
          description: string | null
          median_income: number | null
          population: number | null
          sn_id: string
          sn_name: string
          sn_number: number | null
          zip_codes: string | null
        }
        Insert: {
          council_districts?: string | null
          description?: string | null
          median_income?: number | null
          population?: number | null
          sn_id: string
          sn_name: string
          sn_number?: number | null
          zip_codes?: string | null
        }
        Update: {
          council_districts?: string | null
          description?: string | null
          median_income?: number | null
          population?: number | null
          sn_id?: string
          sn_name?: string
          sn_number?: number | null
          zip_codes?: string | null
        }
        Relationships: []
      }
      themes: {
        Row: {
          focus_area_count: number | null
          theme_color: string | null
          theme_id: string
          theme_name: string
        }
        Insert: {
          focus_area_count?: number | null
          theme_color?: string | null
          theme_id: string
          theme_name: string
        }
        Update: {
          focus_area_count?: number | null
          theme_color?: string | null
          theme_id?: string
          theme_name?: string
        }
        Relationships: []
      }
      time_commitments: {
        Row: {
          description_5th_grade: string | null
          example: string | null
          max_minutes: number | null
          min_minutes: number | null
          time_id: string
          time_name: string
          time_order: number | null
        }
        Insert: {
          description_5th_grade?: string | null
          example?: string | null
          max_minutes?: number | null
          min_minutes?: number | null
          time_id: string
          time_name: string
          time_order?: number | null
        }
        Update: {
          description_5th_grade?: string | null
          example?: string | null
          max_minutes?: number | null
          min_minutes?: number | null
          time_id?: string
          time_name?: string
          time_order?: number | null
        }
        Relationships: []
      }
      translations: {
        Row: {
          content_id: string | null
          content_type: string | null
          data_source: string | null
          field_name: string | null
          is_verified: string | null
          language_id: string | null
          last_updated: string | null
          machine_translated: string | null
          translated_text: string | null
          translation_id: string
          verified_by: string | null
          verified_date: string | null
        }
        Insert: {
          content_id?: string | null
          content_type?: string | null
          data_source?: string | null
          field_name?: string | null
          is_verified?: string | null
          language_id?: string | null
          last_updated?: string | null
          machine_translated?: string | null
          translated_text?: string | null
          translation_id: string
          verified_by?: string | null
          verified_date?: string | null
        }
        Update: {
          content_id?: string | null
          content_type?: string | null
          data_source?: string | null
          field_name?: string | null
          is_verified?: string | null
          language_id?: string | null
          last_updated?: string | null
          machine_translated?: string | null
          translated_text?: string | null
          translation_id?: string
          verified_by?: string | null
          verified_date?: string | null
        }
        Relationships: []
      }
      user_actions: {
        Row: {
          action_date: string | null
          action_log_id: string
          action_type_id: string | null
          campaign_id: string | null
          cta_id: string | null
          data_source: string | null
          duration_minutes: number | null
          event_id: string | null
          focus_area_ids: string | null
          impact_points: number | null
          is_verified: string | null
          last_updated: string | null
          notes: string | null
          opportunity_id: string | null
          target_name: string | null
          target_type: string | null
          user_id: string | null
          verified_by: string | null
        }
        Insert: {
          action_date?: string | null
          action_log_id: string
          action_type_id?: string | null
          campaign_id?: string | null
          cta_id?: string | null
          data_source?: string | null
          duration_minutes?: number | null
          event_id?: string | null
          focus_area_ids?: string | null
          impact_points?: number | null
          is_verified?: string | null
          last_updated?: string | null
          notes?: string | null
          opportunity_id?: string | null
          target_name?: string | null
          target_type?: string | null
          user_id?: string | null
          verified_by?: string | null
        }
        Update: {
          action_date?: string | null
          action_log_id?: string
          action_type_id?: string | null
          campaign_id?: string | null
          cta_id?: string | null
          data_source?: string | null
          duration_minutes?: number | null
          event_id?: string | null
          focus_area_ids?: string | null
          impact_points?: number | null
          is_verified?: string | null
          last_updated?: string | null
          notes?: string | null
          opportunity_id?: string | null
          target_name?: string | null
          target_type?: string | null
          user_id?: string | null
          verified_by?: string | null
        }
        Relationships: []
      }
      user_badges: {
        Row: {
          badge_id: string | null
          data_source: string | null
          display_order: number | null
          earned_date: string | null
          earned_via: string | null
          is_displayed: string | null
          last_updated: string | null
          points_at_earning: number | null
          share_count: number | null
          user_badge_id: string
          user_id: string | null
        }
        Insert: {
          badge_id?: string | null
          data_source?: string | null
          display_order?: number | null
          earned_date?: string | null
          earned_via?: string | null
          is_displayed?: string | null
          last_updated?: string | null
          points_at_earning?: number | null
          share_count?: number | null
          user_badge_id: string
          user_id?: string | null
        }
        Update: {
          badge_id?: string | null
          data_source?: string | null
          display_order?: number | null
          earned_date?: string | null
          earned_via?: string | null
          is_displayed?: string | null
          last_updated?: string | null
          points_at_earning?: number | null
          share_count?: number | null
          user_badge_id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      user_journeys: {
        Row: {
          description: string | null
          description_5th_grade: string | null
          example_actions: string | null
          journey_id: string
          journey_name: string
          journey_order: number | null
        }
        Insert: {
          description?: string | null
          description_5th_grade?: string | null
          example_actions?: string | null
          journey_id: string
          journey_name: string
          journey_order?: number | null
        }
        Update: {
          description?: string | null
          description_5th_grade?: string | null
          example_actions?: string | null
          journey_id?: string
          journey_name?: string
          journey_order?: number | null
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          account_status: string
          age_range: string | null
          auth_id: string | null
          county_id: string | null
          created_at: string | null
          display_name: string | null
          email: string | null
          focus_area_interests: string[] | null
          gamification_enabled: boolean | null
          guardian_consent: boolean | null
          guardian_email: string | null
          id: string
          is_minor: boolean | null
          last_active: string | null
          neighborhood_id: string | null
          org_id: string | null
          preferred_language: string | null
          role: string
          zip_code: string | null
        }
        Insert: {
          account_status?: string
          age_range?: string | null
          auth_id?: string | null
          county_id?: string | null
          created_at?: string | null
          display_name?: string | null
          email?: string | null
          focus_area_interests?: string[] | null
          gamification_enabled?: boolean | null
          guardian_consent?: boolean | null
          guardian_email?: string | null
          id?: string
          is_minor?: boolean | null
          last_active?: string | null
          neighborhood_id?: string | null
          org_id?: string | null
          preferred_language?: string | null
          role?: string
          zip_code?: string | null
        }
        Update: {
          account_status?: string
          age_range?: string | null
          auth_id?: string | null
          county_id?: string | null
          created_at?: string | null
          display_name?: string | null
          email?: string | null
          focus_area_interests?: string[] | null
          gamification_enabled?: boolean | null
          guardian_consent?: boolean | null
          guardian_email?: string | null
          id?: string
          is_minor?: boolean | null
          last_active?: string | null
          neighborhood_id?: string | null
          org_id?: string | null
          preferred_language?: string | null
          role?: string
          zip_code?: string | null
        }
        Relationships: []
      }
      user_progress: {
        Row: {
          completed_at: string | null
          data_source: string | null
          is_active: string | null
          last_position: string | null
          last_updated: string | null
          module_id: string | null
          path_id: string | null
          progress_id: string
          quiz_score: number | null
          started_at: string | null
          status: string | null
          time_spent_minutes: number | null
          user_id: string | null
        }
        Insert: {
          completed_at?: string | null
          data_source?: string | null
          is_active?: string | null
          last_position?: string | null
          last_updated?: string | null
          module_id?: string | null
          path_id?: string | null
          progress_id: string
          quiz_score?: number | null
          started_at?: string | null
          status?: string | null
          time_spent_minutes?: number | null
          user_id?: string | null
        }
        Update: {
          completed_at?: string | null
          data_source?: string | null
          is_active?: string | null
          last_position?: string | null
          last_updated?: string | null
          module_id?: string | null
          path_id?: string | null
          progress_id?: string
          quiz_score?: number | null
          started_at?: string | null
          status?: string | null
          time_spent_minutes?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      users: {
        Row: {
          county_id: string | null
          created_date: string | null
          display_name: string | null
          email: string | null
          focus_area_interests: string | null
          is_verified: string | null
          journey_level: string | null
          language_ids: string | null
          last_active: string | null
          skill_ids: string | null
          user_id: string
          zip_code: number | null
        }
        Insert: {
          county_id?: string | null
          created_date?: string | null
          display_name?: string | null
          email?: string | null
          focus_area_interests?: string | null
          is_verified?: string | null
          journey_level?: string | null
          language_ids?: string | null
          last_active?: string | null
          skill_ids?: string | null
          user_id: string
          zip_code?: number | null
        }
        Update: {
          county_id?: string | null
          created_date?: string | null
          display_name?: string | null
          email?: string | null
          focus_area_interests?: string | null
          is_verified?: string | null
          journey_level?: string | null
          language_ids?: string | null
          last_active?: string | null
          skill_ids?: string | null
          user_id?: string
          zip_code?: number | null
        }
        Relationships: []
      }
      vote_records: {
        Row: {
          bill_number: string | null
          chamber: string | null
          created_at: string | null
          data_source: string | null
          id: string
          official_id: string
          policy_id: string | null
          roll_call_number: string | null
          vote: string
          vote_date: string | null
        }
        Insert: {
          bill_number?: string | null
          chamber?: string | null
          created_at?: string | null
          data_source?: string | null
          id?: string
          official_id: string
          policy_id?: string | null
          roll_call_number?: string | null
          vote: string
          vote_date?: string | null
        }
        Update: {
          bill_number?: string | null
          chamber?: string | null
          created_at?: string | null
          data_source?: string | null
          id?: string
          official_id?: string
          policy_id?: string | null
          roll_call_number?: string | null
          vote?: string
          vote_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vote_records_official_id_fkey"
            columns: ["official_id"]
            isOneToOne: false
            referencedRelation: "elected_officials"
            referencedColumns: ["official_id"]
          },
          {
            foreignKeyName: "vote_records_official_id_fkey"
            columns: ["official_id"]
            isOneToOne: false
            referencedRelation: "officials_braided"
            referencedColumns: ["official_id"]
          },
          {
            foreignKeyName: "vote_records_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "policies"
            referencedColumns: ["policy_id"]
          },
          {
            foreignKeyName: "vote_records_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "policies_braided"
            referencedColumns: ["policy_id"]
          },
        ]
      }
      voting_locations: {
        Row: {
          address: string | null
          city: string | null
          county_id: string | null
          data_source: string | null
          election_id: string | null
          has_curbside: string | null
          has_parking: string | null
          hours_early_voting: string | null
          hours_election_day: string | null
          is_accessible: string | null
          is_active: string | null
          last_updated: string | null
          latitude: number | null
          location_id: string
          location_name: string
          location_type: string | null
          longitude: number | null
          precinct_ids: string | null
          transit_accessible: string | null
          zip_code: number | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          county_id?: string | null
          data_source?: string | null
          election_id?: string | null
          has_curbside?: string | null
          has_parking?: string | null
          hours_early_voting?: string | null
          hours_election_day?: string | null
          is_accessible?: string | null
          is_active?: string | null
          last_updated?: string | null
          latitude?: number | null
          location_id: string
          location_name: string
          location_type?: string | null
          longitude?: number | null
          precinct_ids?: string | null
          transit_accessible?: string | null
          zip_code?: number | null
        }
        Update: {
          address?: string | null
          city?: string | null
          county_id?: string | null
          data_source?: string | null
          election_id?: string | null
          has_curbside?: string | null
          has_parking?: string | null
          hours_early_voting?: string | null
          hours_election_day?: string | null
          is_accessible?: string | null
          is_active?: string | null
          last_updated?: string | null
          latitude?: number | null
          location_id?: string
          location_name?: string
          location_type?: string | null
          longitude?: number | null
          precinct_ids?: string | null
          transit_accessible?: string | null
          zip_code?: number | null
        }
        Relationships: []
      }
      zip_codes: {
        Row: {
          city: string | null
          congressional_district: string | null
          county_id: string | null
          neighborhood_id: number | null
          state_house_district: string | null
          state_senate_district: string | null
          zip_code: number
        }
        Insert: {
          city?: string | null
          congressional_district?: string | null
          county_id?: string | null
          neighborhood_id?: number | null
          state_house_district?: string | null
          state_senate_district?: string | null
          zip_code: number
        }
        Update: {
          city?: string | null
          congressional_district?: string | null
          county_id?: string | null
          neighborhood_id?: number | null
          state_house_district?: string | null
          state_senate_district?: string | null
          zip_code?: number
        }
        Relationships: []
      }
      zip_tract_xref: {
        Row: {
          data_source: string | null
          last_updated: string | null
          overlap_pct: number | null
          primary_tract: string | null
          tract_id: string | null
          xref_id: string
          zip_code: number | null
        }
        Insert: {
          data_source?: string | null
          last_updated?: string | null
          overlap_pct?: number | null
          primary_tract?: string | null
          tract_id?: string | null
          xref_id: string
          zip_code?: number | null
        }
        Update: {
          data_source?: string | null
          last_updated?: string | null
          overlap_pct?: number | null
          primary_tract?: string | null
          tract_id?: string | null
          xref_id?: string
          zip_code?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      officials_braided: {
        Row: {
          address: string | null
          bio: string | null
          classification_v2: Json | null
          committees: Json | null
          description_5th_grade: string | null
          district_id: string | null
          district_type: string | null
          email: string | null
          focus_area_ids: string | null
          jurisdiction: string | null
          level: string | null
          office_phone: string | null
          official_id: string | null
          official_name: string | null
          party: string | null
          photo_url: string | null
          policy_connections: Json | null
          social_media: Json | null
          title: string | null
          website: string | null
        }
        Insert: {
          address?: string | null
          bio?: string | null
          classification_v2?: Json | null
          committees?: never
          description_5th_grade?: string | null
          district_id?: string | null
          district_type?: string | null
          email?: string | null
          focus_area_ids?: string | null
          jurisdiction?: string | null
          level?: string | null
          office_phone?: string | null
          official_id?: string | null
          official_name?: string | null
          party?: string | null
          photo_url?: string | null
          policy_connections?: never
          social_media?: Json | null
          title?: string | null
          website?: string | null
        }
        Update: {
          address?: string | null
          bio?: string | null
          classification_v2?: Json | null
          committees?: never
          description_5th_grade?: string | null
          district_id?: string | null
          district_type?: string | null
          email?: string | null
          focus_area_ids?: string | null
          jurisdiction?: string | null
          level?: string | null
          office_phone?: string | null
          official_id?: string | null
          official_name?: string | null
          party?: string | null
          photo_url?: string | null
          policy_connections?: never
          social_media?: Json | null
          title?: string | null
          website?: string | null
        }
        Relationships: []
      }
      policies_braided: {
        Row: {
          bill_number: string | null
          classification_v2: Json | null
          data_source: string | null
          focus_area_ids: string | null
          fts: unknown
          introduced_date: string | null
          last_action: string | null
          last_action_date: string | null
          last_updated: string | null
          level: string | null
          official_ids: string | null
          policy_id: string | null
          policy_name: string | null
          policy_type: string | null
          source_url: string | null
          sponsors: Json | null
          status: string | null
          summary_5th_grade: string | null
        }
        Insert: {
          bill_number?: string | null
          classification_v2?: Json | null
          data_source?: string | null
          focus_area_ids?: string | null
          fts?: unknown
          introduced_date?: string | null
          last_action?: string | null
          last_action_date?: string | null
          last_updated?: string | null
          level?: string | null
          official_ids?: string | null
          policy_id?: string | null
          policy_name?: string | null
          policy_type?: string | null
          source_url?: string | null
          sponsors?: never
          status?: string | null
          summary_5th_grade?: string | null
        }
        Update: {
          bill_number?: string | null
          classification_v2?: Json | null
          data_source?: string | null
          focus_area_ids?: string | null
          fts?: unknown
          introduced_date?: string | null
          last_action?: string | null
          last_action_date?: string | null
          last_updated?: string | null
          level?: string | null
          official_ids?: string | null
          policy_id?: string | null
          policy_name?: string | null
          policy_type?: string | null
          source_url?: string | null
          sponsors?: never
          status?: string | null
          summary_5th_grade?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      upsert_translation: {
        Args: {
          p_content_id: string
          p_content_type: string
          p_field_name: string
          p_language_id: string
          p_translated_text: string
          p_translation_id: string
        }
        Returns: undefined
      }
      user_role: { Args: never; Returns: string }
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
