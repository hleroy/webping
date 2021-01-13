FROM nginx:latest

# Remove existing index.html and copy our static content
RUN rm /usr/share/nginx/html/index.html
COPY html /usr/share/nginx/html
