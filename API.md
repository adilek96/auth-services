# Документация API аутентификации

## Общая информация

- Базовый URL: `http://localhost:3000/graphql`
- Формат: GraphQL
- Для защищенных запросов требуется заголовок: `Authorization: Bearer <accessToken>`

## CORS

API поддерживает CORS для следующих доменов:

- `http://localhost:3000` (бэкенд)
- `http://localhost:5173` (Vite)

Разрешенные методы:

- GET
- POST
- PUT
- DELETE
- OPTIONS

Разрешенные заголовки:

- Content-Type
- Authorization

Поддержка credentials включена для работы с куками и заголовками авторизации.

## Мутации

### 1. Регистрация

```graphql
mutation {
  register(
    email: "test@example.com"
    password: "123456"
    confirmPassword: "123456"
    name: "Test User"
  ) {
    id
    email
    name
    isVerified
  }
}
```

**Ответ:**

```json
{
  "data": {
    "register": {
      "id": "uuid",
      "email": "test@example.com",
      "name": "Test User",
      "isVerified": false
    }
  }
}
```

**Примечание:** После регистрации на email отправляется код подтверждения.

### 2. Верификация email

```graphql
mutation {
  verifyEmail(email: "test@example.com", code: "123456") {
    success
    message
    accessToken
    refreshToken
    email
    name
  }
}
```

**Ответ:**

```json
{
  "data": {
    "verifyEmail": {
      "success": true,
      "message": "Email verified successfully",
      "accessToken": "jwt-token",
      "refreshToken": "jwt-refresh-token",
      "email": "test@example.com",
      "name": "Test User"
    }
  }
}
```

**Примечание:** После успешной верификации сразу выдаются токены доступа и данные пользователя. Дополнительный вход не требуется.

### 3. Вход через email/password

```graphql
mutation {
  login(email: "test@example.com", password: "123456") {
    accessToken
    refreshToken
    email
    name
  }
}
```

**Ответ:**

```json
{
  "data": {
    "login": {
      "accessToken": "jwt-token",
      "refreshToken": "jwt-refresh-token",
      "email": "test@example.com",
      "name": "Test User"
    }
  }
}
```

### 4. Вход через Google

```graphql
mutation {
  googleAuth(token: "google-id-token") {
    accessToken
    refreshToken
    email
    name
  }
}
```

**Ответ:** Аналогичен ответу login
**Примечание:** Требуется токен от Google Sign-In API

### 5. Вход через Facebook

```graphql
mutation {
  facebookAuth(token: "facebook-access-token") {
    accessToken
    refreshToken
    email
    name
  }
}
```

**Ответ:** Аналогичен ответу login
**Примечание:** Требуется токен от Facebook Login API

### 6. Обновление токенов

```graphql
mutation {
  refreshTokens(refreshToken: "ваш-refresh-token") {
    accessToken
    refreshToken
    email
    name
  }
}
```

**Ответ:** Аналогичен ответу login
**Примечание:** Используется когда accessToken истек (15 минут)

### 7. Выход из системы

```graphql
mutation {
  logout
}
```

**Ответ:**

```json
{
  "data": {
    "logout": true
  }
}
```

**Примечание:**

- Требует авторизации (нужен валидный access token в заголовке)
- При отсутствии авторизации вернет ошибку: `User not authenticated`
- После успешного выхода refresh token удаляется из базы данных

## Ошибки

Все мутации могут возвращать следующие ошибки:

```json
{
  "errors": [
    {
      "message": "Описание ошибки",
      "extensions": {
        "code": "ERROR_CODE"
      }
    }
  ]
}
```

### Коды ошибок:

- `UNAUTHORIZED` - Неверные учетные данные
- `USER_NOT_FOUND` - Пользователь не найден
- `INVALID_TOKEN` - Неверный токен
- `TOKEN_EXPIRED` - Токен истек
- `EMAIL_NOT_VERIFIED` - Email не подтвержден
- `INVALID_VERIFICATION_CODE` - Неверный код подтверждения

## Таймауты

- Код подтверждения email действителен 30 минут
- Access token действителен 15 минут
- Refresh token действителен 7 дней
- Неверифицированные пользователи удаляются через 30 минут

## Безопасность

1. Все пароли хешируются с помощью bcrypt
2. Токены подписываются с помощью JWT
3. Для социальной аутентификации используются официальные SDK
4. Защищенные запросы требуют валидный access token
5. При выходе refresh token удаляется из базы данных

## Интеграция с фронтендом

1. Сохраняйте access и refresh токены после успешной аутентификации
2. Добавляйте access token в заголовок для защищенных запросов
3. Используйте refresh token для получения новых токенов
4. При получении ошибки `TOKEN_EXPIRED` используйте refreshTokens мутацию
5. При получении ошибки `UNAUTHORIZED` перенаправляйте на страницу входа

## Социальная аутентификация

### Google

1. Получите `GOOGLE_CLIENT_ID` из Google Cloud Console
2. Используйте Google Sign-In SDK для получения ID токена
3. Отправьте токен в `googleAuth` мутацию

### Facebook

1. Получите `FACEBOOK_APP_ID` из Facebook Developers Console
2. Используйте Facebook Login SDK для получения access токена
3. Отправьте токен в `facebookAuth` мутацию
