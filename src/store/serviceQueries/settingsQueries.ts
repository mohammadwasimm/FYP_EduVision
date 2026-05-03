import { queryClient } from '../store';
import { settingsApi } from '../apiClients/settingsClient';

export const SettingsQueries = {
  getSettings: () =>
    queryClient.fetchQuery({
      queryKey: ['settings'],
      queryFn: () => settingsApi.get().then((r) => {
        const body = (r as any).data;
        return body && body.data ? body.data : body;
      }),
    }),

  updateSettings: (payload: any) =>
    queryClient.fetchQuery({
      queryKey: ['settingsUpdate', payload],
      queryFn: () => settingsApi.update(payload).then((r) => {
        const body = (r as any).data;
        return body && body.data ? body.data : body;
      }),
    }),
};

export default SettingsQueries;
