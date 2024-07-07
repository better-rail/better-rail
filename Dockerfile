FROM node:14

ENV ENVIRONMENT=development

WORKDIR /usr/src/app

COPY package.json yarn.lock ./

RUN yarn install

COPY . .

# Rename Firebase development configs based on OS
RUN if [ "$(uname)" == "Darwin" ] || [ "$(expr substr $(uname -s) 1 5)" == "Linux" ]; then \
      yarn rename-dev-configs; \
    else \
      cp /ios/firebase-config.development.js /ios/firebase-config.js && \
      cp /android/app/firebase-config.development.js /android/app/firebase-config.js; \
    fi

EXPOSE 8081

CMD ["yarn", "start"]
