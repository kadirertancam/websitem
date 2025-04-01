FROM nginx:alpine

# Web sitesi dosyalarını kopyala
COPY . /usr/share/nginx/html/

# Nginx konfigürasyonunu güncelle (isteğe bağlı)
# COPY nginx.conf /etc/nginx/conf.d/default.conf

# 80 portunu dışarıya aç
EXPOSE 80

# Nginx'i çalıştır
CMD ["nginx", "-g", "daemon off;"]
