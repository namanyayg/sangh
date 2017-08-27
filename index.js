const parser = require('rss-parser')
const nodemailer = require('nodemailer')
const Sequelize = require('sequelize')

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

const transporter = nodemailer.createTransport({
  sendmail: true,
  newline: 'windows',
  path: '/usr/sbin/sendmail'
})

const RSS_URL = `https://www.reddit.com/r/programming/new/.rss?sort=new`
const TO_EMAIL = `you@domain.com`

const formatEntry = entry => ({
  to: TO_EMAIL,
  subject: `${ entry.title }`,
  html: `${ entry.content }`
})

const sendEmail = entry => {
  transporter.sendMail(entry, (err, info) => {
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
