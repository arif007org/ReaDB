Template.importCSV.events({
 "click #importCSV" : function(event, template) {
  event.stopPropagation();
  event.preventDefault();;
  var f = document.getElementById('fileInput').files[0];
  console.log("read file");
  readFile(f, function(content) {
    Meteor.call('uploadCSV', content);
    Router.go("/books");
    Bert.alert({
        title: 'Import successful!',
        message: 'Sucessfully imported '+f.name+' as CSV',
        type: 'success',
      });
  });
 }
});

Template.importJSON.events({
 "click #importJSON" : function(event, template) {
  event.stopPropagation();
  event.preventDefault();
  var f = document.getElementById('fileInput').files[0];
  console.log("read file");
  readFile(f, function(content) {
    Meteor.call('uploadJSON',content);
    Router.go("/")

    Session.set("notification", "Sucessfully imported "+f.name+" as CSV");
  });
 }
});


Template.bookList.helpers({
  books: function(){
    var tag = Session.get("findBy");
    var filters = Session.get("filters");
    var sortBy = Session.get("sortBy");
    var sortOrder = Session.get("sortOrder");

    if (sortBy){
      if(sortOrder){
        var sort = {};
        sort[sortBy] = parseInt(sortOrder);
        var sortQuery = {};
        sortQuery["sort"] = sort;
      } else {
        var sortQuery = "{sort: {"+sortBy+": -1}}";
      }
      Session.set("sortQuery", sortQuery);
    }
    var sortQuery = Session.get("sortQuery");
    // console.log(sortQuery);
    if(tag){
      console.log(tag);
      var search = {"tags": {$regex: tag, $options: "i"}};
      fetchBooks(search);
    } else if (sortQuery) {
      var query = sortQuery;
      fetchBooks(null, sortQuery, null);
    } else {
      fetchBooks();
    }
    var books = Session.get("books");
    for (var book in books) {
      // books[book].text = books[book].text.replace(/\n/g,"<br/>");
      books[book].tags = tagsToArray(books[book].tags);
      if (books[book].tags.length > 3) {
        var tags = books[book].tags;
        var truncatedTags = [ tags[0], tags[1], tags[2] ];
        books[book].tags = truncatedTags;
      }
    }
    return books;
  },
  stats: function(){
    var tag = Session.get("findBy");
    if(tag){
      var tagRegExp = new RegExp(tag,"i");
      var query = {"tags":tagRegExp};
      var tag = Session.get("findBy");
      if (tag) {
        var search = {"tags": {$regex: tag, $options: "i"}};
        getUserStatistics(Meteor.userId(), search);
      } else {
        getUserStatistics(Meteor.userId(), null);
      }
      var stats = Session.get("userStats")
      stats.tagSearch = tag;
      return stats;
    } else {
      getUserStatistics(Session.get("profileUserId"), null);
      return Session.get("userStats");
    }
  }
});

Template.bookList.events({
  "click #clearTagFilter": function(event, template){
    event.stopPropagation();
    event.preventDefault();
    Session.set("findBy", "");
    Router.go("/books")
  }
})


Template.search.helpers({
  booksIndex: () => BooksIndex,
  index: function () {
    return BooksIndex;
  }
});

Template.layout.onRendered(function (){
  function WidthChange(mq) {
    if (!mq.matches) {
      var body =  document.getElementsByTagName("body")[0];
      body.classList.toggle('nav-open');
      var icon = document.getElementById("toggle-sidebar-icon");
      var text = document.getElementById("toggle-sidebar-text");
      if (body.classList.contains('nav-open')) {
        icon.classList.add("fa-times-circle");
        icon.classList.remove("fa-bars");
        text.classList.add("hidden");
      } else {
        icon.classList.remove("fa-times-circle");
        icon.classList.add("fa-bars");
        text.classList.remove("hidden");
      }
    }
  }
  var mq = window.matchMedia("(min-width: 960px)");
  mq.addListener(WidthChange);
  WidthChange(mq);

  if(Session.get("bert-next-notification")){
    var n = Session.get("bert-next-notification");
    Bert.alert({
      title: n.title,
      message: n.message,
      type: n.type
    });
    Session.get("bert-next-notification", null);
  }
})


Template.layout.events({
  "click #toggle-sidebar": function(event, template){
    var body =  document.getElementsByTagName("body")[0];
    body.classList.toggle('nav-open');
    var icon = document.getElementById("toggle-sidebar-icon");
    var text = document.getElementById("toggle-sidebar-text");
    if (body.classList.contains('nav-open')) {
      icon.classList.add("fa-times-circle");
      icon.classList.remove("fa-bars");
      text.classList.add("hidden");
    } else {
      icon.classList.remove("fa-times-circle");
      icon.classList.add("fa-bars");
      text.classList.remove("hidden");
    }
  },
  "click #login-buttons-logout": function() {
    Meteor.logout(function () {
      loginButtonsSession.closeDropdown();
    });
  }
});

Template.login.rendered = function() {
  Accounts._loginButtonsSession.set('dropdownVisible', true);
  // Meteor.setTimeout(function(){
    // document.getElementById('login-sign-in-link').style.display = 'none';   document.getElementsByClassName('login-close-text')[0].style.display = 'none';
  // },5000)

};

Template._loginButtonsLoggedOut.helpers({
  dropdown: dropdown,
  services: getLoginServices,
  singleService: function () {
    var services = getLoginServices();
    if (services.length !== 1)
      throw new Error(
        "Shouldn't be rendering this template with more than one configured service");
    return services[0];
  },
  configurationLoaded: function () {
    return Accounts.loginServicesConfigured();
  }
});

Template.pleaseLogin.events({
  'click #signup-link': function () {
    Router.go("/login");
    loginButtonsSession.resetMessages();
    // store values of fields before swtiching to the signup form
    var username = trimmedElementValueById('login-username');
    var email = trimmedElementValueById('login-email');
    var usernameOrEmail = trimmedElementValueById('login-username-or-email');
    // notably not trimmed. a password could (?) start or end with a space
    var password = elementValueById('login-password');

    loginButtonsSession.set('inSignupFlow', true);
    loginButtonsSession.set('inForgotPasswordFlow', false);
    // force the ui to update so that we have the approprate fields to fill in
    Tracker.flush();

    // update new fields with appropriate defaults
    if (username !== null)
      document.getElementById('login-username').value = username;
    else if (email !== null)
      document.getElementById('login-email').value = email;
    else if (usernameOrEmail !== null)
      if (usernameOrEmail.indexOf('@') === -1)
        document.getElementById('login-username').value = usernameOrEmail;
    else
      document.getElementById('login-email').value = usernameOrEmail;

    if (password !== null)
      document.getElementById('login-password').value = password;

    // Force redrawing the `login-dropdown-list` element because of
    // a bizarre Chrome bug in which part of the DIV is not redrawn
    // in case you had tried to unsuccessfully log in before
    // switching to the signup form.
    //
    // Found tip on how to force a redraw on
    // http://stackoverflow.com/questions/3485365/how-can-i-force-webkit-to-redraw-repaint-to-propagate-style-changes/3485654#3485654
    var redraw = document.getElementById('login-dropdown-list');
    redraw.style.display = 'none';
    redraw.offsetHeight; // it seems that this line does nothing but is necessary for the redraw to work
    redraw.style.display = 'block';
  }
});

Template.filterBar.events({
  "click .filter-bar": function(event, template){
    event.preventDefault();
    var sortByValue = document.getElementById("filterbar-sortby").value;
    Session.set("sortBy", sortByValue);
    var sortOrderValue = document.getElementById("filterbar-sortorder").value;;
    Session.set("sortOrder",sortOrderValue);
  }
});


Template.navigation.helpers({
  displayName: function(){
    fetchDisplayName(Meteor.userId())
    return Session.get("displayName");
  }
});


Template.viewBook.helpers({
  book: function(){
    var bookId = Session.get("bookId");
    Meteor.call("fetchBook", bookId, function(err, res){
      if(err){
        throw err;
      } else if (res) {
        var book = res;
        var tagsArray = tagsToArray(book.tags);
        book.tags = tagsArray;
        book.review = book.review.replace(/\n/g,"<br>");
        Session.set("book",book);
        return book;
      }
    });
    return Session.get("book");
  }
});

Template.editBook.helpers({
  book: function(){
    var bookId = Session.get("bookId");
    Meteor.call("fetchBook", bookId, function(err,res){
      if (err) {
        throw err;
      } if (res) {
        Session.set("bookToEdit", res);
      } else {
        Bert.alert({
            title: 'Book not found',
            message: 'Could not edit book because there is no book with id '+bookId,
            type: 'warning',
          });
      }
    });
    return Session.get("bookToEdit");
  },
  bookId: function(){
    return Session.get("bookId")
  }
});

Template.editBook.events({
  "submit form": function(event, template){
    event.preventDefault();
    event.stopPropagation();
    var bookId = Session.get("bookId");
    console.log(bookId);
    var book = Session.get("bookToEdit");
    console.log(book);

    d = new Date();
    var dateModified = d.yyyymmdd();
    book.isbn = event.target.isbn.value;
    book.title = event.target.title.value;
    console.log(book.title);
    book.author = event.target.author.value;
    book.rating = event.target.rating.value;
    book.dateRead = event.target.dateRead.value;
    book.tags = event.target.tags.value;
    book.review = event.target.review.value;
    book.notes = event.target.notes.value;
    book.meta.userId = Meteor.userId();
    book.meta.dateModified = dateModified;
    book.meta.dateModifiedSort = new Date(dateModified).getTime() / 1000;

    Meteor.call("updateBook", bookId, book, function(err, res){
      if (err) throw err;
      if (res) {
        console.log("RESSSS");
        Router.go("/");
        return res;
      }
    });
  }
});

Template.editBookJSON.helpers({
  bookJSON: function(){
    var bookId = Session.get("bookId");
    return JSON.stringify(Books.findOne({_id: bookId}), null, 2);
  },
  bookId: function(){
    return Session.get("bookId")
  }
});

Template.editBookJSON.events({
  "submit form": function(){
    var bookId = Session.get("bookId");
    var updatedBookJSON = document.getElementById("bookJSON").value;
    Meteor.call("updateBook", bookId, JSON.parse(updatedBookJSON), function(err, res){
      if (err) throw err;
      if (res) return res;
    });
  }
});

Template.viewUserProfile.events({
  "click #deleteBooks": function(event, template){
    Bert.alert({
        title: 'Farenheight 451!',
        message: 'All the books in your library have been deleted.',
        type: 'info',
      });
    Meteor.call("deleteCurrentUsersBooks");
    window.location.reload();
  },
  "click #updateLibraryMetadata": function(){
    updateLibraryMetadata()
    var el = document.getElementById("updateLibraryMetadata");
    Session.set("updateStatus","<i class='fa fa-spinner fa-spin'></i> Working…");
    el.innerHTML = Session.get("updateStatus");
  },
  "click #updateUsername": function(){
    var newUsername = document.getElementById("newUsername").value;
    var oldUsername = Meteor.users.find({_id:Meteor.userId()}).fetch()[0].username;
    Session.set("newUsername",newUsername);
    Session.set("oldUsername",oldUsername);
    Bert.alert({
        title: 'Hello, '+ newUsername,
        message: 'Username sucessfully changed from '+oldUsername+' to '+ newUsername,
        type: 'success',
      });
    Meteor.call("updateUsername", newUsername, function(err, res){
      if(res){
        Router.go("/");
      } if (err) {
        throw err;
      }
    });
  }
});

Template.viewUserProfile.helpers({
  stats: function(){
    getUserStatistics(Session.get("profileUserId"), null);
    return Session.get("userStats");
  },
  displayName: function(){
    console.log(Session.get("displayName"));
    return Session.get("displayName");
  }
});

Template.viewBook.events({

  "click #updateBookMetadata": function(){
    console.log("click!");
    var bookId = Session.get("bookId");
    updateBookMetadata(bookId);
  },
  "click #increaseMetadataIndex": function(){
    var index = Session.get("metadataResponseIndex");
    if (index){
      var newIndex = index + 1;
      Session.set("metadataResponseIndex", newIndex);
    } else {
      Session.set("metadataResponseIndex", 1);
    }
    var bookId = Session.get("bookId");
    updateBookMetadata(bookId);
  },
  "click #decreaseMetadataIndex": function(){
    var index = Session.get("metadataResponseIndex");
    if (index && index > 0){
      var newIndex = index - 1;
      Session.set("metadataResponseIndex", newIndex);
    } else {
      Session.set("metadataResponseIndex", 0);
    }
    var bookId = Session.get("bookId");
    updateBookMetadata(bookId);
    Bert.alert({
      title: 'Updating metadata…',
    });
  }
});

Template.exportJSON.helpers({
  "JSON": function(){
    var fields = {fields: {"_id":0}};
    fetchBooks(undefined, fields);
    return encodeURIComponent(toJSONString(Session.get("books")));
  }
});

Template.exportCSV.helpers({
  CSV: function(){
    return Meteor.call('processCSV');
  },
  encodedCSV: function(){
    Meteor.call('processCSV', function(err,res){
      if(err){
        return err;
      } else {
        Session.set("CSV", res);
      }
    });
    return encodeURIComponent(Session.get("CSV"));
  }
});

Template.exportCSV.events({
  "click #download-csv":function(){
    console.log("click!!!");
    console.log(toJSONString(fetchBooks()));
    var JSON = toJSONString(fetchBooks());
    downloadFile(encodeURIComponent(Meteor.call("processCSV")),"csv");
  }
});


Template.addBook.events({
  "click #fetchFromISBN": function(event, template){
    event.preventDefault();
    event.stopPropagation();

    var isbn = document.getElementById("isbnInput").value;
    var title = document.getElementById("titleInput").value;
    var author = document.getElementById("authorInput").value;

    console.log(isbn);
    console.log(title);
    console.log(author);

    Meteor.call("fetchBookMetadata", isbn, title, author, function(error, result){
      if(result){
        var metadata = JSON.parse(result.content).items[0];
        var isbnInput = document.getElementById('isbnInput');
        var titleInput = document.getElementById('titleInput');
        var authorInput = document.getElementById('authorInput');
        var publicationDateInput = document.getElementById('publicationDateInput');
        var publisherDescriptionInput = document.getElementById('publisherDescriptionInput');
        var tagsInput = document.getElementById('tagsInput');
        var ratingInput = document.getElementById('ratingInput');
        var imgUrlInput = document.getElementById('imgUrlInput');
        var pageCountInput = document.getElementById('pageCountInput')

        if(!isbn){
          if (metadata.volumeInfo.industryIdentifiers[1]){
            isbnInput.value = metadata.volumeInfo.industryIdentifiers[1].identifier;
          }else {
            isbnInput.value = metadata.volumeInfo.industryIdentifiers[0].identifier;
          }
        }
        titleInput.value = metadata.volumeInfo.title;
        authorInput.value = metadata.volumeInfo.authors;
        publicationDateInput.value = metadata.volumeInfo.publishedDate;
        publisherDescriptionInput.value = metadata.volumeInfo.description;
        tagsInput.value = metadata.volumeInfo.categories;
        ratingInput.value =  metadata.volumeInfo.averageRating;
        imgUrlInput.value = metadata.volumeInfo.imageLinks.thumbnail;
        pageCountInput.value = metadata.volumeInfo.pageCount;

      }
      if(error){
        Bert.alert({
            title: 'Metadata not found…',
            message: 'Error fetching metadata from ISBN: '+error,
            type: 'warning',
          });
      }
    });

  },
  "submit form": function(event, template){
    event.preventDefault();
    event.stopPropagation();
    d = new Date();
    var dateAdded = d.yyyymmdd();
    var newBook = {
      "isbn": event.target.isbn.value,
      "title": event.target.title.value,
      "author": event.target.author.value,
      "rating": event.target.rating.value,
      "dateRead": event.target.dateRead.value,
      "format": event.target.format.value,
      "tags": event.target.tags.value,
      "review": event.target.review.value,
      "notes": event.target.notes.value,
      "meta": {
        "userId": Meteor.userId(),
        "dateAdded": dateAdded,
        "dateReadSort": new Date(event.target.dateRead.value).getTime() / 1000
      },
      "publisherMetadata": {
        "imgUrl": event.target.imgUrl.value,
        "pubdate": event.target.pubdate.value,
        "publisherDescription": event.target.publisherDescription.value,
        "pageCount": event.target.pageCount.value,
        "imgUrl": event.target.imgUrl.value
      }
    };
    Meteor.call("insertBook", newBook, function(err, res){
      if (err) {
        throw err;
      } if (res) {
        Session.set("notification", "☑ "+event.target.title.value+" sucessfully added to database");
        Router.go("/");
        return;
      } else {
        console.log("insert book method call failed");
        return false;
      }
    });
  }
});
