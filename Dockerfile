FROM timbru31/ruby-node:2.6-14

WORKDIR /app

RUN gem update bundler
COPY Gemfile Gemfile.lock /app/
RUN bundle install

COPY package.json package-lock.json /app/
RUN npm install

COPY . /app/

CMD ["npm", "start"]
