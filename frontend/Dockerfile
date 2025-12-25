# Stage 1: Build
FROM node:18-alpine AS build
WORKDIR /app

# Copy package.json & install
COPY package*.json ./
RUN npm install

# Copy all code
COPY . .

ARG REACT_APP_API_URL

# Pass build argument as env variable for React build
ENV REACT_APP_API_URL=$REACT_APP_API_URL

# Run build
RUN npm run build

# Stage 2: Serve with nginx
FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]