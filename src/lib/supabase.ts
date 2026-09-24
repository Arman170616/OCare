const queryBuilder = {
  select: () => queryBuilder,
  eq: () => queryBuilder,
  in: () => queryBuilder,
  order: () => queryBuilder,
  limit: () => queryBuilder,
  maybeSingle: async () => ({ data: null, error: null }),
  insert: async () => ({ data: null, error: null }),
  update: async () => ({ data: null, error: null }),
  delete: async () => ({ data: null, error: null }),
  then: (resolve: (value: { data: any[]; error: null }) => void) => resolve({ data: [], error: null }),
};

export const supabase: any = {
  auth: {
    getSession: async () => ({ data: { session: null } }),
    onAuthStateChange: () => ({
      data: {
        subscription: {
          unsubscribe: () => undefined,
        },
      },
    }),
    signInWithPassword: async () => ({ error: null }),
    signUp: async () => ({ data: { user: null }, error: null }),
    signOut: async () => undefined,
  },
  from: () => queryBuilder,
  rpc: async () => ({ data: null, error: null }),
};
