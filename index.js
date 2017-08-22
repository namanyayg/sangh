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
  newline: 'unix',
  path: '/usr/sbin/sendmail'
})

const RSS_URL = `https://www.reddit.com/r/forhire+jobbit+DesignJobs/new/.rss?sort=new`
const TO_EMAIL = `namanyay.goel@gmail.com`

const formatEntry = entry => ({
  to: TO_EMAIL,
  subject: `[W] ${ entry.title }`,
  text: `${ entry.content }

  <a href="${ entry.link }">Link to post</a>
  <a href="${ entry.author.split('/')[2] }">User</a>
  <a href="https://www.reddit.com/message/compose?to=${ entry.author.split('/')[2] }&subject=&message=Hey%2C%0A%0A%5BNamanyay+Goel+%28portfolio%29%5D%28http%3A%2F%2Fnamanyayg.com%2F%29">Message Lead</a>`
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
