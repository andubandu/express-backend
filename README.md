# Social Media API Documentation

A RESTful API for a social media platform with user authentication, posts, and media upload capabilities.

## Base URL

```
https://your-api-url.vercel.app
```

## Authentication

The API uses JWT (JSON Web Token) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

## Endpoints

### Authentication

#### Sign Up
- **URL**: `/auth/signup`
- **Method**: `POST`
- **Content-Type**: `multipart/form-data`
- **Body**:
  ```json
  {
    "username": "string",
    "password": "string",
    "email": "string",
    "avatar": "file (optional)"
  }
  ```
- **Response**: 
  ```json
  {
    "token": "jwt_token",
    "user": {
      "id": "user_id",
      "username": "string",
      "email": "string",
      "avatar": "string (url)"
    }
  }
  ```

#### Login
- **URL**: `/auth/login`
- **Method**: `POST`
- **Content-Type**: `application/json`
- **Body**:
  ```json
  {
    "username": "string",
    "password": "string"
  }
  ```
- **Response**: 
  ```json
  {
    "token": "jwt_token",
    "user": {
      "id": "user_id",
      "username": "string",
      "email": "string",
      "avatar": "string (url)"
    }
  }
  ```

### Users

#### Get All Users
- **URL**: `/users`
- **Method**: `GET`
- **Authentication**: Not required
- **Response**: Array of user objects (passwords excluded)

#### Get User by Username
- **URL**: `/users/:username`
- **Method**: `GET`
- **Authentication**: Not required
- **Response**: User object (password excluded)

#### Update User
- **URL**: `/users/upd/:id`
- **Method**: `PUT`
- **Authentication**: Required
- **Content-Type**: `multipart/form-data`
- **Body**:
  ```json
  {
    "username": "string (optional)",
    "email": "string (optional)",
    "avatar": "file (optional)"
  }
  ```
- **Response**: Updated user object

#### Delete User
- **URL**: `/users/del/:id`
- **Method**: `DELETE`
- **Authentication**: Required
- **Response**: Status 204 (No Content)

### Posts

#### Get All Posts
- **URL**: `/posts`
- **Method**: `GET`
- **Authentication**: Not required
- **Response**: Array of post objects with populated author information

#### Get Post by ID
- **URL**: `/posts/:id`
- **Method**: `GET`
- **Authentication**: Not required
- **Response**: Post object with populated author information

#### Create Post
- **URL**: `/posts/new`
- **Method**: `POST`
- **Authentication**: Required
- **Content-Type**: `multipart/form-data`
- **Body**:
  ```json
  {
    "title": "string",
    "content": "string",
    "media": "file (optional)"
  }
  ```
- **Response**: Created post object

#### Update Post
- **URL**: `/posts/upd/:id`
- **Method**: `PUT`
- **Authentication**: Required
- **Content-Type**: `multipart/form-data`
- **Body**:
  ```json
  {
    "title": "string (optional)",
    "content": "string (optional)",
    "media": "file (optional)"
  }
  ```
- **Response**: Updated post object

#### Delete Post
- **URL**: `/posts/del/:id`
- **Method**: `DELETE`
- **Authentication**: Required
- **Response**: Status 204 (No Content)

## Media Upload

- Supported file types: Images and Videos
- Maximum file size: 15MB
- Files are stored in Cloudinary
- Image/video URLs are returned in the response

## Error Responses

All error responses follow this format:
```json
{
  "error": "Error message description"
}
```

Common HTTP Status Codes:
- `200`: Success
- `201`: Created
- `204`: No Content
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

## Environment Variables Required

```
PORT=3000
URL=mongodb_connection_string
JWT_SECRET=your_jwt_secret
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

## Rate Limiting

Currently, there are no rate limits implemented.

## Security Features

- Password hashing using bcrypt
- JWT-based authentication
- File type validation for uploads
- MongoDB injection protection
- CORS enabled