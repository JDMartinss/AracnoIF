import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../services/api';
import { rooms } from '../data';

const resources = ['classes', 'lessons', 'notices', 'rooms', 'teachers'];
const initialData = () => ({ classes: [], lessons: [], notices: [], rooms, teachers: [] });

export function useCampusData(userId, onError) {
  const [data, setData] = useState(initialData);
  const [status, setStatus] = useState('loading');
  const generation = useRef(0);
  const errorHandler = useRef(onError);
  errorHandler.current = onError;
  const reset = useCallback(() => {
    generation.current++;
    setData(initialData());
    setStatus('loading');
  }, []);
  const refresh = useCallback(async () => {
    const id = ++generation.current;
    try {
      const results = await Promise.all(resources.map((name) => api(`/${name}`)));
      if (id !== generation.current) return;
      setData(Object.fromEntries(resources.map((name, index) => [name, results[index]])));
      setStatus('ready');
    } catch (error) {
      if (id !== generation.current) return;
      setStatus('error');
      throw error;
    }
  }, []);
  useEffect(() => {
    if (!userId) {
      reset();
      return;
    }
    setStatus('loading');
    const update = () => refresh().catch((error) => errorHandler.current(error));
    update();
    const timer = setInterval(() => {
      if (!document.hidden) update();
    }, 5000);
    return () => {
      clearInterval(timer);
      generation.current++;
    };
  }, [userId, refresh, reset]);
  return { data, status, refresh, reset };
}
