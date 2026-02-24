FROM node:22-slim

# Install Python + pip for the analyzer
RUN apt-get update && apt-get install -y python3 python3-pip && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy backend code and install Node deps
COPY backend ./backend
WORKDIR /app/backend
RUN npm install

# Install Python dependencies
WORKDIR /app/backend/python
RUN pip3 install --no-cache-dir -r requirements.txt

# Back to backend root
WORKDIR /app/backend

ENV PORT=5000
EXPOSE 5000

CMD ["node", "server.js"]

