export async function requestJSON(url, options = {}, timeoutMs = 15000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    let data;
    try {
      data = await response.json();
    } catch (error) {
      if (controller.signal.aborted) throw error;
      throw new Error('O servidor retornou uma resposta inválida. Tente novamente.');
    }
    if (!response.ok) {
      const error = new Error(data.error || 'Não foi possível concluir a ação.');
      error.status = response.status;
      throw error;
    }
    return data;
  } catch (error) {
    if (controller.signal.aborted)
      throw new Error(
        'A conexão demorou demais. Confira se a ação foi concluída antes de tentar novamente.',
      );
    if (error instanceof TypeError)
      throw new Error('Sem conexão com o servidor. Confira sua conexão e tente novamente.');
    throw error;
  } finally {
    clearTimeout(timer);
  }
}
