FROM timbru31/ruby-node:3.1

WORKDIR /app

RUN gem update bundler
COPY Gemfile Gemfile.lock /app/
RUN bundle install

COPY package.json package-lock.json /app/
RUN npm install

COPY . /app/

CMD ["npm", "start"]
