FROM node:20-alpine AS build
WORKDIR /build

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build -- --configuration production

FROM nginx:1.27-alpine AS runtime

RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf security-headers.conf /etc/nginx/conf.d/
RUN mv /etc/nginx/conf.d/nginx.conf /etc/nginx/conf.d/pmt.conf

COPY --from=build /build/dist/client_web/browser/ /usr/share/nginx/html/

EXPOSE 80

HEALTHCHECK --interval=15s --timeout=4s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1/ >/dev/null 2>&1 || exit 1
