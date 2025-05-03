/**
 * Отправляет текстовый промпт на API бэкенда.
 * @param {string} prompt - Текст сообщения пользователя.
 * @returns {Promise<string>} - Промис, который разрешается ответом ИИ.
 * @throws {Error} - Выбрасывает ошибку при проблемах с сетью или ответом сервера.
 */
export async function sendPromptToAPI(prompt) {
    console.log(`Отправка промпта на /api/dialogue: "${prompt}"`);
    try {
        const response = await fetch("/api/dialogue", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json", // Указываем, что ожидаем JSON
            },
            body: JSON.stringify({ prompt: prompt }), // Отправляем { "prompt": "текст" }
        });

        // Проверяем статус ответа
        if (!response.ok) {
            // Пытаемся прочитать тело ошибки, если оно есть
            let errorText = `Статус ${response.status}: ${response.statusText}`;
            try {
                const errorBody = await response.json(); // Или response.text() если ошибка не JSON
                errorText = errorBody.error || JSON.stringify(errorBody) || errorText; // Пытаемся извлечь сообщение об ошибке
            } catch (e) {
                // Игнорируем ошибку парсинга тела ошибки
            }
            throw new Error(`Ошибка сервера: ${errorText}`);
        }

        // Парсим JSON-ответ
        const data = await response.json();

        // Проверяем, есть ли поле 'response' в ответе
        if (!data || typeof data.response === 'undefined') {
            throw new Error("Некорректный формат ответа от сервера: отсутствует поле 'response'");
        }

        console.log(`Получен ответ от ИИ: "${data.response}"`);
        return data.response; // Возвращаем текст ответа ИИ

    } catch (error) {
        console.error("Ошибка при вызове API /api/dialogue:", error);
        // Перебрасываем ошибку для обработки в вызывающем коде
        throw error;
    }
}