import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://vuzrhhzssetakpzwctmg.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_U6Qaa_MFfJmgKV6mB6HC1Q_75OD1pnj';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  },
});

const getSortOptions = (sort) => {
  if (!sort) return null;
  const direction = sort.startsWith('-') ? false : true;
  const column = sort.startsWith('-') ? sort.slice(1) : sort;
  return { column, ascending: direction };
};

const buildListQuery = (table, sort, limit) => {
  let query = supabase.from(table).select('*');
  const sortOptions = getSortOptions(sort);
  if (sortOptions) {
    query = query.order(sortOptions.column, { ascending: sortOptions.ascending });
  }
  if (limit) {
    query = query.limit(limit);
  }
  return query;
};

const buildFilterQuery = (table, filters, sort, limit) => {
  let query = supabase.from(table).select('*');
  if (filters && typeof filters === 'object') {
    Object.entries(filters).forEach(([key, value]) => {
      if (value === undefined || value === null) return;
      if (Array.isArray(value)) {
        query = query.in(key, value);
      } else {
        query = query.eq(key, value);
      }
    });
  }
  const sortOptions = getSortOptions(sort);
  if (sortOptions) {
    query = query.order(sortOptions.column, { ascending: sortOptions.ascending });
  }
  if (limit) {
    query = query.limit(limit);
  }
  return query;
};

const createEntity = (table) => ({
  list: async (sort, limit) => {
    const { data, error } = await buildListQuery(table, sort, limit);
    if (error) throw error;
    return data ?? [];
  },
  filter: async (filters, sort, limit) => {
    const { data, error } = await buildFilterQuery(table, filters, sort, limit);
    if (error) throw error;
    return data ?? [];
  },
  create: async (payload) => {
    const { data, error } = await supabase.from(table).insert(payload).select();
    if (error) throw error;
    return Array.isArray(data) ? data[0] : data;
  },
  update: async (id, payload) => {
    const { data, error } = await supabase.from(table).update(payload).eq('id', id).select();
    if (error) throw error;
    return Array.isArray(data) ? data[0] : data;
  },
  delete: async (id) => {
    const { data, error } = await supabase.from(table).delete().eq('id', id).select();
    if (error) throw error;
    return data ?? [];
  },
  subscribe: (callback) => {
    const channelName = `realtime-${table}-${Math.random().toString(36).slice(2)}`;
    const channel = supabase.channel(channelName);
    channel.on('postgres_changes', { event: '*', schema: 'public', table }, (payload) => {
      callback({ type: payload.eventType, data: payload.new, old: payload.old });
    });
    channel.subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  },
});

const auth = {
  loginViaEmailPassword: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  },
  register: async ({ email, password }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    if (error) throw error;
    return data;
  },
  verifyOtp: async () => {
    throw new Error('OTP não é suportado nesta integração Supabase. Use login com email e senha.');
  },
  setToken: () => { },
  resendOtp: async () => {
    throw new Error('OTP não é suportado nesta integração Supabase.');
  },
  resetPasswordRequest: async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    });
    if (error) throw error;
    return true;
  },
  resetPassword: async ({ resetToken, newPassword }) => {
    const { data, error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
    return data;
  },
  logout: async (redirectUrl) => {
    await supabase.auth.signOut();
    if (redirectUrl) window.location.href = redirectUrl;
  },
  me: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error) throw error;
    return data.user;
  },
  redirectToLogin: (redirectTo) => {
    window.location.href = '/login';
  },
};

export const base44 = {
  supabase,
  entities: {
    Service: createEntity('Service'),
    Installation: createEntity('Installation'),
    ServiceType: createEntity('ServiceType'),
    LocalUser: createEntity('LocalUser'),
    RecurringService: createEntity('RecurringService'),
    ChatConversation: createEntity('ChatConversation'),
    ChatMessage: createEntity('ChatMessage'),
  },
  integrations: {
    Core: {
      UploadFile: async ({ file, bucket = 'chat-uploads' }) => {
        const fileName = `${Date.now()}-${file.name.replace(/\s+/g, '_')}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(fileName, file, { cacheControl: '3600', upsert: false });

        if (uploadError) throw uploadError;

        const { data: publicUrlData, error: urlError } = await supabase.storage
          .from(bucket)
          .getPublicUrl(fileName);

        if (urlError) throw urlError;
        return { file_url: publicUrlData.publicUrl };
      },
    },
  },
  auth,
};
