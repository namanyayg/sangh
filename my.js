const parser = require('rss-parser')
const Sequelize = require('sequelize')
const nodemailer = require('nodemailer')
const sgTransport = require('nodemailer-sendgrid')

const sequelize = new Sequelize({
  host: 'localhost',
  dialect: 'sqlite',
  storage: './posts.sqlite'
})

const Post = sequelize.define('post', {
  id: {
    type: Sequelize.STRING,
    notNull: true,
    primaryKey: true
  }
}, {
  timestamps: false
})

Post.sync()

const mailer = nodemailer.createTransport(
  sgTransport({
    apiKey:
      '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'
  })
)

const RSS_URL = `https://www.reddit.com/r/forhire+jobbit+DesignJobs/new/.rss?sort=new`
const TO_EMAIL = `namanyay.goel@gmail.com`

const formatEntry = entry => ({
  from: 'nommyg@namanyayg.com',
  to: TO_EMAIL,
  subject: `[W] ${ entry.title }`,
  html: `${ entry.content }

  <a href="${ entry.link }">Link to post</a>
  <a href="http://reddit.com${ entry.author }">User</a>
  <a href="https://www.reddit.com/message/compose?to=${ entry.author.split('/')[2] }&subject=&message=Hey%2C%0A%0A%5BNamanyay+Goel+%28portfolio%29%5D%28http%3A%2F%2Fnamanyayg.com%2F%29">Message Lead</a>`
})

const sendEmail = entry => {
  mailer.sendMail(entry, (err, info) => {
    console.log(err, info)
  })
}

parser.parseURL(RSS_URL, async (err, parsed) => {
  let entries = parsed.feed.entries.splice(0, 3)

  for (entry of entries) {
    await Post.findOrCreate({
      where: { id: entry.id }
    }).spread((_, created) => {
      if (created) {
        // if a new entry had to be created, send an email
        sendEmail(formatEntry(entry))
      }
    })
  }
})
