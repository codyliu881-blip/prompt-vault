export type Database = {
  public: {
    Tables: {
      categories: {
        Row: {
          id: string;
          type: "image" | "video";
          name: string;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          type: "image" | "video";
          name: string;
          sort_order?: number;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["categories"]["Insert"]>;
        Relationships: [];
      };
      prompts: {
        Row: {
          id: string;
          title: string;
          body: string;
          type: "image" | "video";
          category_id: string | null;
          tags: string[];
          source_url: string | null;
          notes: string | null;
          is_favorite: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          body: string;
          type: "image" | "video";
          category_id?: string | null;
          tags?: string[];
          source_url?: string | null;
          notes?: string | null;
          is_favorite?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["prompts"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "prompts_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
        ];
      };
      prompt_versions: {
        Row: {
          id: string;
          prompt_id: string;
          version_no: number;
          label: string;
          body: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          prompt_id: string;
          version_no: number;
          label?: string;
          body: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["prompt_versions"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "prompt_versions_prompt_id_fkey";
            columns: ["prompt_id"];
            isOneToOne: false;
            referencedRelation: "prompts";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
};
