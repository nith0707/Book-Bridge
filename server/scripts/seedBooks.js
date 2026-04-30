require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Book     = require('../models/Book');

const ol = isbn => `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`;

const books = [
  // THRILLER – Freida McFadden
  { title:'The Housemaid',                            author:'Freida McFadden',       category:'Thriller',      rentPrice:22, buyPrice:349, isbn:'9781538742570', image:ol('9781538742570') },
  { title:"The Housemaid's Secret",                   author:'Freida McFadden',       category:'Thriller',      rentPrice:22, buyPrice:349, isbn:'9780349132600', image:ol('9780349132600') },
  { title:'The Locked Door',                          author:'Freida McFadden',       category:'Thriller',      rentPrice:20, buyPrice:329, isbn:'9781728249476', image:ol('9781728249476') },
  { title:'The Teacher',                              author:'Freida McFadden',       category:'Thriller',      rentPrice:20, buyPrice:319, isbn:'9781538742624', image:ol('9781538742624') },
  { title:'Never Never',                              author:'Freida McFadden',       category:'Thriller',      rentPrice:18, buyPrice:299, isbn:'9781728249483', image:ol('9781728249483') },
  // THRILLER – Others
  { title:'Gone Girl',                                author:'Gillian Flynn',         category:'Thriller',      rentPrice:20, buyPrice:299, isbn:'9780307588371', image:ol('9780307588371') },
  { title:'Sharp Objects',                            author:'Gillian Flynn',         category:'Thriller',      rentPrice:18, buyPrice:279, isbn:'9780307341556', image:ol('9780307341556') },
  { title:'Dark Places',                              author:'Gillian Flynn',         category:'Thriller',      rentPrice:18, buyPrice:279, isbn:'9780307341570', image:ol('9780307341570') },
  { title:'The Girl with the Dragon Tattoo',          author:'Stieg Larsson',         category:'Thriller',      rentPrice:25, buyPrice:399, isbn:'9780307454546', image:ol('9780307454546') },
  { title:'The Da Vinci Code',                        author:'Dan Brown',             category:'Thriller',      rentPrice:22, buyPrice:349, isbn:'9780385504201', image:ol('9780385504201') },
  { title:'Angels and Demons',                        author:'Dan Brown',             category:'Thriller',      rentPrice:20, buyPrice:329, isbn:'9780671027360', image:ol('9780671027360') },
  { title:'Inferno',                                  author:'Dan Brown',             category:'Thriller',      rentPrice:20, buyPrice:329, isbn:'9780385537858', image:ol('9780385537858') },
  { title:'The Silent Patient',                       author:'Alex Michaelides',      category:'Thriller',      rentPrice:22, buyPrice:349, isbn:'9781250301697', image:ol('9781250301697') },
  { title:'The Girl on the Train',                    author:'Paula Hawkins',         category:'Thriller',      rentPrice:20, buyPrice:319, isbn:'9781594634024', image:ol('9781594634024') },
  { title:'The Woman in the Window',                  author:'A.J. Finn',             category:'Thriller',      rentPrice:20, buyPrice:319, isbn:'9780062678416', image:ol('9780062678416') },
  { title:'Behind Closed Doors',                      author:'B.A. Paris',            category:'Thriller',      rentPrice:18, buyPrice:299, isbn:'9781250121004', image:ol('9781250121004') },
  { title:'Verity',                                   author:'Colleen Hoover',        category:'Thriller',      rentPrice:20, buyPrice:319, isbn:'9781538724736', image:ol('9781538724736') },
  { title:'In a Dark Dark Wood',                      author:'Ruth Ware',             category:'Thriller',      rentPrice:18, buyPrice:299, isbn:'9781501112331', image:ol('9781501112331') },
  { title:'The Turn of the Key',                      author:'Ruth Ware',             category:'Thriller',      rentPrice:18, buyPrice:299, isbn:'9781982110567', image:ol('9781982110567') },
  { title:'One of Us Is Lying',                       author:'Karen M. McManus',      category:'Thriller',      rentPrice:16, buyPrice:279, isbn:'9781524714680', image:ol('9781524714680') },
  // PHILOSOPHICAL
  { title:'The Alchemist',                            author:'Paulo Coelho',          category:'Philosophical', rentPrice:15, buyPrice:249, isbn:'9780062315007', image:ol('9780062315007') },
  { title:'Veronika Decides to Die',                  author:'Paulo Coelho',          category:'Philosophical', rentPrice:14, buyPrice:229, isbn:'9780061990199', image:ol('9780061990199') },
  { title:'Siddhartha',                               author:'Hermann Hesse',         category:'Philosophical', rentPrice:12, buyPrice:199, isbn:'9780553208849', image:ol('9780553208849') },
  { title:'Thus Spoke Zarathustra',                   author:'Friedrich Nietzsche',   category:'Philosophical', rentPrice:15, buyPrice:249, isbn:'9780140441185', image:ol('9780140441185') },
  { title:'Meditations',                              author:'Marcus Aurelius',       category:'Philosophical', rentPrice:12, buyPrice:199, isbn:'9780140449334', image:ol('9780140449334') },
  { title:"Man's Search for Meaning",                 author:'Viktor Frankl',         category:'Philosophical', rentPrice:14, buyPrice:229, isbn:'9780807014271', image:ol('9780807014271') },
  { title:'The Stranger',                             author:'Albert Camus',          category:'Philosophical', rentPrice:13, buyPrice:219, isbn:'9780679720201', image:ol('9780679720201') },
  { title:'The Power of Now',                         author:'Eckhart Tolle',         category:'Philosophical', rentPrice:14, buyPrice:239, isbn:'9781577314806', image:ol('9781577314806') },
  { title:'The Midnight Library',                     author:'Matt Haig',             category:'Philosophical', rentPrice:16, buyPrice:279, isbn:'9780525559474', image:ol('9780525559474') },
  { title:"Sophie's World",                           author:'Jostein Gaarder',       category:'Philosophical', rentPrice:15, buyPrice:249, isbn:'9780374530716', image:ol('9780374530716') },
  // ROMCOM
  { title:'Pride and Prejudice',                      author:'Jane Austen',           category:'RomCom',        rentPrice:10, buyPrice:199, isbn:'9780141439518', image:ol('9780141439518') },
  { title:'Sense and Sensibility',                    author:'Jane Austen',           category:'RomCom',        rentPrice:10, buyPrice:199, isbn:'9780141439662', image:ol('9780141439662') },
  { title:'Emma',                                     author:'Jane Austen',           category:'RomCom',        rentPrice:10, buyPrice:199, isbn:'9780141439587', image:ol('9780141439587') },
  { title:'It Ends with Us',                          author:'Colleen Hoover',        category:'RomCom',        rentPrice:18, buyPrice:299, isbn:'9781501110368', image:ol('9781501110368') },
  { title:'November 9',                               author:'Colleen Hoover',        category:'RomCom',        rentPrice:16, buyPrice:269, isbn:'9781501110375', image:ol('9781501110375') },
  { title:'Ugly Love',                                author:'Colleen Hoover',        category:'RomCom',        rentPrice:16, buyPrice:269, isbn:'9781476753188', image:ol('9781476753188') },
  { title:'Beach Read',                               author:'Emily Henry',           category:'RomCom',        rentPrice:16, buyPrice:269, isbn:'9781984806734', image:ol('9781984806734') },
  { title:'People We Meet on Vacation',               author:'Emily Henry',           category:'RomCom',        rentPrice:16, buyPrice:269, isbn:'9781984806758', image:ol('9781984806758') },
  { title:'Book Lovers',                              author:'Emily Henry',           category:'RomCom',        rentPrice:16, buyPrice:269, isbn:'9781984806772', image:ol('9781984806772') },
  { title:'The Hating Game',                          author:'Sally Thorne',          category:'RomCom',        rentPrice:16, buyPrice:269, isbn:'9780062439598', image:ol('9780062439598') },
  // FANFICTION
  { title:"Harry Potter and the Philosopher's Stone", author:'J.K. Rowling',         category:'FanFiction',    rentPrice:25, buyPrice:399, isbn:'9780439708180', image:ol('9780439708180') },
  { title:'Harry Potter and the Chamber of Secrets',  author:'J.K. Rowling',         category:'FanFiction',    rentPrice:25, buyPrice:399, isbn:'9780439064873', image:ol('9780439064873') },
  { title:'Harry Potter and the Prisoner of Azkaban', author:'J.K. Rowling',         category:'FanFiction',    rentPrice:25, buyPrice:399, isbn:'9780439136365', image:ol('9780439136365') },
  { title:'Harry Potter and the Goblet of Fire',      author:'J.K. Rowling',         category:'FanFiction',    rentPrice:25, buyPrice:429, isbn:'9780439139601', image:ol('9780439139601') },
  { title:'Harry Potter and the Order of the Phoenix',author:'J.K. Rowling',         category:'FanFiction',    rentPrice:28, buyPrice:449, isbn:'9780439358071', image:ol('9780439358071') },
  { title:'The Hobbit',                               author:'J.R.R. Tolkien',       category:'FanFiction',    rentPrice:20, buyPrice:319, isbn:'9780547928227', image:ol('9780547928227') },
  { title:'The Fellowship of the Ring',               author:'J.R.R. Tolkien',       category:'FanFiction',    rentPrice:22, buyPrice:349, isbn:'9780618346257', image:ol('9780618346257') },
  { title:'A Game of Thrones',                        author:'George R.R. Martin',   category:'FanFiction',    rentPrice:25, buyPrice:399, isbn:'9780553593716', image:ol('9780553593716') },
  { title:'The Name of the Wind',                     author:'Patrick Rothfuss',     category:'FanFiction',    rentPrice:22, buyPrice:349, isbn:'9780756404741', image:ol('9780756404741') },
  { title:'Mistborn: The Final Empire',               author:'Brandon Sanderson',    category:'FanFiction',    rentPrice:22, buyPrice:349, isbn:'9780765311788', image:ol('9780765311788') },
  // EDUCATION
  { title:'Atomic Habits',                            author:'James Clear',           category:'Education',     rentPrice:18, buyPrice:349, isbn:'9780735211292', image:ol('9780735211292') },
  { title:'Sapiens',                                  author:'Yuval Noah Harari',     category:'Education',     rentPrice:22, buyPrice:379, isbn:'9780062316097', image:ol('9780062316097') },
  { title:'Thinking, Fast and Slow',                  author:'Daniel Kahneman',       category:'Education',     rentPrice:20, buyPrice:349, isbn:'9780374533557', image:ol('9780374533557') },
  { title:'Deep Work',                                author:'Cal Newport',           category:'Education',     rentPrice:18, buyPrice:329, isbn:'9781455586691', image:ol('9781455586691') },
  { title:'The Psychology of Money',                  author:'Morgan Housel',         category:'Education',     rentPrice:18, buyPrice:329, isbn:'9780857197689', image:ol('9780857197689') },
  { title:'Rich Dad Poor Dad',                        author:'Robert Kiyosaki',       category:'Education',     rentPrice:16, buyPrice:279, isbn:'9781612680194', image:ol('9781612680194') },
  { title:'Outliers',                                 author:'Malcolm Gladwell',      category:'Education',     rentPrice:16, buyPrice:299, isbn:'9780316017930', image:ol('9780316017930') },
  { title:'A Brief History of Time',                  author:'Stephen Hawking',       category:'Education',     rentPrice:18, buyPrice:329, isbn:'9780553380163', image:ol('9780553380163') },
  { title:'Zero to One',                              author:'Peter Thiel',           category:'Education',     rentPrice:18, buyPrice:329, isbn:'9780804139021', image:ol('9780804139021') },
  { title:'The 48 Laws of Power',                     author:'Robert Greene',         category:'Education',     rentPrice:20, buyPrice:349, isbn:'9780140280197', image:ol('9780140280197') },
  { title:'Start with Why',                           author:'Simon Sinek',           category:'Education',     rentPrice:16, buyPrice:279, isbn:'9781591846444', image:ol('9781591846444') },
  { title:'The Subtle Art of Not Giving a Fck',       author:'Mark Manson',           category:'Education',     rentPrice:16, buyPrice:279, isbn:'9780062457714', image:ol('9780062457714') },
  { title:'Homo Deus',                                author:'Yuval Noah Harari',     category:'Education',     rentPrice:20, buyPrice:349, isbn:'9780062464316', image:ol('9780062464316') },
  { title:'Ikigai',                                   author:'Hector Garcia',         category:'Education',     rentPrice:14, buyPrice:249, isbn:'9780143130727', image:ol('9780143130727') },
  { title:'How to Win Friends and Influence People',  author:'Dale Carnegie',         category:'Education',     rentPrice:14, buyPrice:249, isbn:'9780671027032', image:ol('9780671027032') },
  // BTech CSE
  { title:'Introduction to Algorithms',               author:'Thomas H. Cormen',      category:'Computer Science',     rentPrice:35, buyPrice:799, isbn:'9780262033848', image:ol('9780262033848') },
  { title:'The C Programming Language',               author:'Brian W. Kernighan',    category:'Computer Science',     rentPrice:25, buyPrice:499, isbn:'9780131103627', image:ol('9780131103627') },
  { title:'Clean Code',                               author:'Robert C. Martin',      category:'Computer Science',     rentPrice:28, buyPrice:599, isbn:'9780132350884', image:ol('9780132350884') },
  { title:'The Pragmatic Programmer',                 author:'Andrew Hunt',           category:'Computer Science',     rentPrice:28, buyPrice:599, isbn:'9780135957059', image:ol('9780135957059') },
  { title:'Design Patterns',                          author:'Erich Gamma',           category:'Computer Science',     rentPrice:30, buyPrice:649, isbn:'9780201633610', image:ol('9780201633610') },
  { title:'Head First Java',                          author:'Kathy Sierra',          category:'Computer Science',     rentPrice:28, buyPrice:599, isbn:'9780596009205', image:ol('9780596009205') },
  { title:'Effective Java',                           author:'Joshua Bloch',          category:'Computer Science',     rentPrice:30, buyPrice:649, isbn:'9780134685991', image:ol('9780134685991') },
  { title:'Python Crash Course',                      author:'Eric Matthes',          category:'Computer Science',     rentPrice:22, buyPrice:449, isbn:'9781593279288', image:ol('9781593279288') },
  { title:'Automate the Boring Stuff with Python',    author:'Al Sweigart',           category:'Computer Science',     rentPrice:20, buyPrice:399, isbn:'9781593275990', image:ol('9781593275990') },
  { title:'Cracking the Coding Interview',            author:'Gayle Laakmann McDowell',category:'Computer Science',   rentPrice:25, buyPrice:549, isbn:'9780984782857', image:ol('9780984782857') },
  { title:'Artificial Intelligence: A Modern Approach',author:'Stuart Russell',       category:'Computer Science',     rentPrice:35, buyPrice:799, isbn:'9780136042594', image:ol('9780136042594') },
  { title:'Deep Learning',                            author:'Ian Goodfellow',        category:'Computer Science',     rentPrice:35, buyPrice:799, isbn:'9780262035613', image:ol('9780262035613') },
  { title:'Operating System Concepts',                author:'Abraham Silberschatz',  category:'Computer Science',     rentPrice:30, buyPrice:699, isbn:'9781118063330', image:ol('9781118063330') },
  { title:'Computer Networks',                        author:'Andrew S. Tanenbaum',   category:'Computer Science',     rentPrice:30, buyPrice:699, isbn:'9780132126953', image:ol('9780132126953') },
  { title:'Database System Concepts',                 author:'Abraham Silberschatz',  category:'Computer Science',     rentPrice:30, buyPrice:699, isbn:'9780078022159', image:ol('9780078022159') },
];

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  await Book.deleteMany({});
  console.log('Cleared existing books');

  await Book.insertMany(books);
  console.log(`✅ Seeded ${books.length} books`);

  await mongoose.disconnect();
}

seed().catch(err => { console.error(err); process.exit(1); });
