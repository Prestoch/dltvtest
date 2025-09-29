
var DotaBuffCP = {

  VERSION: '0.7.1',

  initialized: false,

  initialize: function () {
    this.lineup = [ -1, -1, -1, -1, -1 ];
    this.lineup2 = [ -1, -1, -1, -1, -1 ];
    this.initialized = true;
    
  },

  heroId: function (name) {

    for (var i in heroes)
      if (heroes[i].toLowerCase ().indexOf (name.toLowerCase ()) >= 0
        && heroes[i].length === name.length)
        return i;

    return -1;

  },

  heroAbbrLookup: {
    "abaddon": ["avernus"],
    "alchemist": ["razzil"],
    "ancient apparition": ["kaldr", "aa"],
    "anti-mage": ["am"],
    "axe": [],
    "bane": ["atropos"],
    "batrider": [],
    "beastmaster": ["karroch", "rexxar", "bm"],
    "bloodseeker": ["strygwyr", "bs"],
    "bounty hunter": ["gondar", "bh"],
    "brewmaster": ["mangix", "bm"],
    "bristleback": ["rigwarl", "bb"],
    "broodmother": ["bm"],
    "centaur warrunner": ["bradwarden", "cw"],
    "chaos knight": ["ck"],
    "chen": [],
    "clinkz": ["bone"],
    "clockwerk": ["rattletrap", "cw"],
    "crystal maiden": ["rylai", "cm"],
    "dark seer": ["ish", "ds"],
    "dazzle": [],
    "death prophet": ["krobelus", "grobulus", "dp"],
    "disruptor": [],
    "doom": [],
    "dragon knight": ["davion", "dk"],
    "drow ranger": ["traxex", "dr"],
    "earthshaker": ["raigor", "es"],
    "earth spirit": ["kaolin", "es"],
    "elder titan": ["et"],
    "ember spirit": ["xin", "es"],
    "enchantress": ["aiushtha"],
    "enigma": [],
    "faceless void": ["darkterror"],
    "gyrocopter": ["aurel"],
    "huskar": [],
    "invoker": ["kael", "karl", "carl"],
    "io": ["wisp"],
    "jakiro": ["thd"],
    "juggernaut": ["yurnero"],
    "keeper of the light": ["ezalor", "kotl"],
    "kunkka": [],
    "legion commander": ["tresdin", "lc"],
    "leshrac": [],
    "lich": ["ethreain"],
    "lifestealer": ["naix"],
    "lina": [],
    "lion": [],
    "lone druid": ["sylla", "ld"],
    "luna": [],
    "lycan": ["banehallow"],
    "magnus": [],
    "medusa": ["gorgon"],
    "meepo": ["geomancer"],
    "mirana": ["potm"],
    "morphling": [],
    "naga siren": ["slithice", "ns"],
    "natures prophet": ["furion", "np"],
    "necrophos": [],
    "night stalker": ["ns", "balanar"],
    "nyx assassin": ["na"],
    "ogre magi": ["aggron", "om"],
    "omniknight": ["ok"],
    "outworld devourer": ["od", "harbinger"],
    "phantom assassin": ["pa", "mortred"],
    "phantom lancer": ["azwraith", "pl"],
    "phoenix": [],
    "puck": [],
    "pudge": ["butcher"],
    "pugna": [],
    "queen of pain": ["akasha", "qop"],
    "razor": [],
    "riki": [],
    "rubick": [],
    "sand king": ["crixalis", "sk"],
    "shadow demon": ["sd"],
    "shadow fiend": ["nevermore", "sf"],
    "shadow shaman": ["rhasta", "ss"],
    "silencer": ["nortrom"],
    "skywrath mage": ["dragonus", "sm"],
    "slardar": [],
    "sniper": ["kardel"],
    "spectre": ["mercurial"],
    "spirit breaker": ["barathrum", "sb"],
    "storm spirit": ["raijin", "ss"],
    "sven": [],
    "techies": ["goblin","gt","sqee","spleen","spoon"],
    "templar assassin": ["lanaya", "ta"],
    "terrorblade": ["tb"],
    "tidehunter": ["leviathan"],
    "timbersaw": ["rizzrack"],
    "tinker": ["boush"],
    "tiny": [],
    "treant protector": ["rooftrellen"],
    "troll warlord": ["tw"],
    "tusk": ["ymir"],
    "undying": ["dirge"],
    "vengeful spirit": ["shendelzare", "vs"],
    "venomancer": ["lesale"],
    "visage": [],
    "warlock": ["demnok", "wl"],
    "weaver": ["skitskurr"],
    "windranger": ["lyralei", "wr"],
    "winter wyvern": ["ww"],
    "witch doctor": ["zharvakko", "wd"],
    "wraith king": ["ostarion", "skeleton king", "wk", "sk"],
    "zeus": []
  },

  checkHeroAbbr: function (hero, name) {

    var heroAbbr = this.heroAbbrLookup[hero.toLowerCase ()];

    if (_.isUndefined (name) || _.isUndefined (heroAbbr))
      return false;

    name = name.toLowerCase ();

    for (var i = 0; i < heroAbbr.length; ++i)
      if (heroAbbr[i].indexOf (name) >= 0)
        return true;

    return false;
  },

  listHeroes: function (name) {
    $('#hero-list').html ('');
    _.each (heroes, function (hero, key) {

      if (!_.isUndefined (name) &&
          !DotaBuffCP.checkHeroAbbr (hero, name) &&
          hero.toLowerCase ().indexOf (name.toLowerCase ()) < 0) {
        return;
      }

      if (!heroes_bg[key].match(/^http/)) {
        heroes_bg[key] = 'http://www.dotabuff.com/' + heroes_bg[key];
      }

      $('#hero-list').append (
        $('<li>').attr ('data-hero-id', key).html (
          $('<img>').attr ('src', heroes_bg[key])
        ).append (hero)
      );
    });
  },

  calculate: function () {

    var advantages = Array.apply (null, new Array (heroes.length))
                       .map (Number.prototype.valueOf, 0.0);
    var nb =0;
    for (var h in this.lineup2) {
      var hid = this.lineup2[h];
      if (hid == -1)
        continue;
      nb++;
    }      
    for (var h in this.lineup) {      
      var hid = this.lineup[h];
      if (nb==5) hid = this.lineup2[h];

      if (hid == -1)
        continue;

      for (var i = 0; i < heroes.length; ++i) {
        if (_.isUndefined (win_rates[hid][i]) || _.isNull (win_rates[hid][i]))
          continue;
        //if (nb==4) {
        //  advantages[i] += parseFloat (win_rates[i][hid][0])*-1;        
        //} else {
          advantages[i] += parseFloat (win_rates[hid][i][0]);        
        //}
      }

    }

    return advantages;

  },

  generateLink: function () {

    var link = '#';

    for (var i in this.lineup) {
      if (this.lineup[i] == -1)
        link += '/';
      else
        link += heroes[this.lineup[i]] + '/';
    }

    link = link.replace (/ /g, '_');
    link = link.replace (/\/+$/, '');

    return link;
  },

  getVersion: function () {

    return this.VERSION + '.' + update_time;

  }

};



// Backward compatibility: if heroes_kda not provided by cs.json yet
if (typeof heroes_kda === 'undefined' || !Array.isArray(heroes_kda)) {
  var heroes_kda = [];
  if (typeof heroes !== 'undefined' && Array.isArray(heroes)) {
    for (var __i = 0; __i < heroes.length; ++__i) heroes_kda[__i] = 0;
  }
}

// Backward compatibility: if heroes_d2pt not provided by cs.json yet
if (typeof heroes_d2pt === 'undefined' || !Array.isArray(heroes_d2pt)) {
  var heroes_d2pt = [];
  if (typeof heroes !== 'undefined' && Array.isArray(heroes)) {
    for (var __j = 0; __j < heroes.length; ++__j) heroes_d2pt[__j] = 0;
  }
}

// Backward compatibility: if heroes_nw10 not provided by cs.json yet
if (typeof heroes_nw10 === 'undefined' || !Array.isArray(heroes_nw10)) {
  var heroes_nw10 = [];
  if (typeof heroes !== 'undefined' && Array.isArray(heroes)) {
    for (var __k = 0; __k < heroes.length; ++__k) heroes_nw10[__k] = 0;
  }
}

var MainView = Backbone.View.extend ({

  el: '#main-container',

  initialize: function () {
    this.$el.html (_.template ($('#main-view-template').html ()));
    DotaBuffCP.listHeroes ();
    $('#hero-search').focus ();
  },

  events: {
    'keyup #hero-search': 'heroSearch',
    'click #hero-search-reset': 'heroSearchReset',
    'click #hero-list li': 'addHero',
    'click div.lineup div.col-md-2 img': 'removeHero',
    'click #reset-all': 'resetAll',
    'submit form': function () { return false; }
  },

  heroSearch: function (ev) {
    // reset if Esc pressed
    if (ev.keyCode == 27) {
      $(ev.currentTarget).val ('');
      this.heroSearchReset ();
    }
    // add first hero if enter pressed
    else if (ev.keyCode == 13) {
      this.addFirstHero ();
    }

    else {
      DotaBuffCP.listHeroes ($(ev.currentTarget).val ());
    }

    return false;
  },

  heroSearchReset: function () {
    DotaBuffCP.listHeroes ();
  },

  switchLink: function () {
    var link = DotaBuffCP.generateLink ();
    location.href = link;
  },

  addFirstHero: function () {
    $('#hero-list li:first').trigger ('click');
  },

  addHero: function (ev) {
    var hid = $(ev.currentTarget).attr ('data-hero-id');
    var pick_i = -1;

    this.heroSearchReset ();
    $('#hero-search').val ('');
    $('#hero-search').focus ();

    for (var i in DotaBuffCP.lineup)
      if (DotaBuffCP.lineup[i] == hid)
        return;

    for (var i in DotaBuffCP.lineup2)
      if (DotaBuffCP.lineup[i] == hid)
        return;

    for (var i in DotaBuffCP.lineup) {
      if (DotaBuffCP.lineup[i] == -1) {
        pick_i = i;
        break;
      }
    }

    if (pick_i == -1 && DotaBuffCP.lineup2[0] == -1) {
      DotaBuffCP.lineup2 = [...DotaBuffCP.lineup];      
      
      for (var i=5; i <10; i++) {
          $('#hero-' + i).html($('#hero-' + (i-5)).html());
      }
      for (var i = 0; i < 5; ++i) {
        DotaBuffCP.lineup[i] = -1;
        $('#hero-' + i).html ('');
      }

      pick_i = 0;
      //return;
    }

    DotaBuffCP.lineup[pick_i] = hid;
    //console.log(DotaBuffCP);
    //console.log(heroes);
    //console.log(win_rates);
    //console.log(heroes_wr);
    var kdaVal = (typeof heroes_kda !== 'undefined' && heroes_kda[hid] != null) ? heroes_kda[hid] : 0;
    var kdaTxt = (Number(kdaVal).toFixed ? Number(kdaVal).toFixed(2) : kdaVal);
    var d2ptVal = (typeof heroes_d2pt !== 'undefined' && heroes_d2pt[hid] != null) ? heroes_d2pt[hid] : 0;
    var d2ptTxt = String(parseInt(d2ptVal, 10) || 0);
    var nw10Val = (typeof heroes_nw10 !== 'undefined' && heroes_nw10[hid] != null) ? heroes_nw10[hid] : 0;
    var nw10Txt = String(parseInt(nw10Val, 10) || 0);
    $('#hero-' + pick_i).html ("<div class='kda-label'>" + kdaTxt + " <span class='d2pt-label'>" + d2ptTxt + "</span> <span class='nw10-label'>" + nw10Txt + "</span></div>"
                                         + "<img src='" + heroes_bg[hid] + "' data-idx='" + pick_i + "'>");

    this.calculateAndShow ();
    this.switchLink ();
  },

  addHeroToIndex: function (hid, pick_i) {
    var kdaVal = (typeof heroes_kda !== 'undefined' && heroes_kda[hid] != null) ? heroes_kda[hid] : 0;
    var kdaTxt = (Number(kdaVal).toFixed ? Number(kdaVal).toFixed(2) : kdaVal);
    var d2ptVal = (typeof heroes_d2pt !== 'undefined' && heroes_d2pt[hid] != null) ? heroes_d2pt[hid] : 0;
    var d2ptTxt = String(parseInt(d2ptVal, 10) || 0);
    var nw10Val = (typeof heroes_nw10 !== 'undefined' && heroes_nw10[hid] != null) ? heroes_nw10[hid] : 0;
    var nw10Txt = String(parseInt(nw10Val, 10) || 0);
    $('#hero-' + pick_i).html ("<div class='kda-label'>" + kdaTxt + " <span class='d2pt-label'>" + d2ptTxt + "</span> <span class='nw10-label'>" + nw10Txt + "</span></div>"
                                         + "<img src='" + heroes_bg[hid] + "' data-idx='" + pick_i + "'>");
  },

  removeHero: function (ev) {
    var i = $(ev.currentTarget).attr ('data-idx');
    DotaBuffCP.lineup[i] = -1;
    $('#hero-' + i).html ('');

    this.calculateAndShow ();
    this.switchLink ();
  },

  resetAll: function () {
    for (var i = 0; i < 5; ++i) {
      DotaBuffCP.lineup[i] = -1;
      $('#hero-' + i).html ('');
    }
    $('#score1').html('');
    $('#score2').html('');
    $('#total').html('');
    for (var i = 0; i < 5; ++i) {
      DotaBuffCP.lineup2[i] = -1;
      $('#hero-' + (i+5)).html ('');
    }

    this.calculateAndShow ();
    this.switchLink ();
  },

  isEmpty: function () {
    for (var i in DotaBuffCP.lineup)
      if (DotaBuffCP.lineup[i] != -1)
        return false;
    return true;
  },

  showAdvantages: function (div, advantages) {
    var template = $('#counter-template').html ();
    $('#' + div).html ('');
    _.each (advantages, function (advantage, i) {

      for (var l in DotaBuffCP.lineup)
        if (advantage[1] == DotaBuffCP.lineup[l])
          return;

      $('#' + div).append (_.template (template, {
                                     hero_bg: heroes_bg[advantage[1]],
                                     hero_name: heroes[advantage[1]],
                                     win_rate: heroes_wr[advantage[1]],
                                     advantage: advantage[0].toFixed (2) * -1
                                                 }));
    });
  },

  calculateAndShow: function () {

    if (this.isEmpty ()) {
      $('div.lineup-title').show ();
      $('div.pick-title').hide ();
      $('#reset-all').hide ();
      $('#counters').hide ();
      return;
    } else {
      $('div.lineup-title').hide ();
      $('div.pick-title').show ();
      $('#reset-all').show ();
      $('#counters').show ();
    }

    var advantages = DotaBuffCP.calculate ();

    //console.log(advantages);
    //console.log("lineup ");
    //console.log(DotaBuffCP.lineup);
    //console.log("lineup2 ");
    //console.log(DotaBuffCP.lineup2);    
    var data = '<div class="col-md-1 col-xs-1"></div>'; 
    var data2 = '<div class="col-md-1 col-xs-1"></div>';
    var nb1 =0;
    var nb2=0;
    var is_full = true;
    for (var i=0; i <5; i++) {
        if (DotaBuffCP.lineup[i] == -1 || DotaBuffCP.lineup2[i] == -1) {
          is_full = false;
        }
    }
    

    if (is_full) {
      var nb1kda = 0.0;
      var nb2kda = 0.0;
      var nb1d2pt = 0.0;
      var nb2d2pt = 0.0;
      var nb1nw10 = 0.0;
      var nb2nw10 = 0.0;
      var sumNb1a = 0.0;
      var sumNb2a = 0.0;
      for (var i=0; i <5; i++) {
        var id1 = DotaBuffCP.lineup[i];
        var id3 = DotaBuffCP.lineup2[i];
        var kda1 = (heroes_kda && heroes_kda[id1] != null) ? heroes_kda[id1] : 0;
        var kda2 = (heroes_kda && heroes_kda[id3] != null) ? heroes_kda[id3] : 0;
        nb1 += parseFloat(heroes_wr[id1]);
        nb2 += parseFloat(heroes_wr[id3]);
        nb1kda += parseFloat(kda1);
        nb2kda += parseFloat(kda2);
        nb1d2pt += parseFloat(heroes_d2pt[id1] || 0);
        nb2d2pt += parseFloat(heroes_d2pt[id3] || 0);
        nb1nw10 += parseFloat(heroes_nw10[id1] || 0);
        nb2nw10 += parseFloat(heroes_nw10[id3] || 0);
        var nb1a = 0;
        var nb2a = 0;
        for (var j=0; j <5; j++) {   
          var id2 = DotaBuffCP.lineup2[j];    
          var id4 = DotaBuffCP.lineup[j];    
          nb1a += parseFloat(win_rates[id2][id1][0])*-1;
          nb2a += parseFloat(win_rates[id4][id3][0])*-1;
        }
        sumNb1a += nb1a;
        sumNb2a += nb2a;
        var advDisp1 = (nb1a * -1);
        var advDisp2 = (nb2a * -1);
        var advStr1 = (advDisp1 < 0 ? '-' : '') + Math.abs(advDisp1).toFixed(2);
        var advStr2 = (advDisp2 < 0 ? '-' : '') + Math.abs(advDisp2).toFixed(2);
        var adv1Class = (advDisp1 < 0) ? 'alert alert-danger' : 'alert alert-success';
        var adv2Class = (advDisp2 < 0) ? 'alert alert-danger' : 'alert alert-success';
        var line1a = "<span style='white-space:nowrap'>" + heroes_wr[id1] + " + " + "<span class='" + adv1Class + "' style='padding:0; display:inline-block'>" + advStr1 + "</span></span>";
        var line1b = "<span style='white-space:nowrap'>" + heroes_wr[id3] + " + " + "<span class='" + adv2Class + "' style='padding:0; display:inline-block'>" + advStr2 + "</span></span>";
        var cell1 = "<div class='col-md-2 col-xs-2'>" + line1a + "</div>";
        var cell2 = "<div class='col-md-2 col-xs-2'>" + line1b + "</div>";
        data += cell1;
        data2 += cell2;
        nb1+= nb1a*-1;
        nb2+= nb2a*-1;
      }
      var rightSum1 = "<div class=\"col-md-1 col-xs-1\" style=\"text-align:right\">" + nb1.toFixed(2) + "</div>";
      var rightSum2 = "<div class=\"col-md-1 col-xs-1\" style=\"text-align:right\">" + nb2.toFixed(2) + "</div>";
      $('#score1').html(data + rightSum1);
      $('#score2').html(data2 + rightSum2);
      var wrdelta = (nb1 - nb2).toFixed(2);
      var wrClass = (wrdelta > 0) ? 'alert alert-success' : 'alert alert-danger';
      var kdadelta = (nb1kda - nb2kda).toFixed(2);
      var kdaClass = (kdadelta > 0) ? 'alert alert-success' : 'alert alert-danger';
      var d2ptdelta = (nb1d2pt - nb2d2pt).toFixed(2);
      var d2ptClass = (d2ptdelta > 0) ? 'alert alert-success' : 'alert alert-danger';
      var wrBubble = "<span class='" + wrClass + "' style='display:inline-block; padding:5px; margin:0 2px'>= " + wrdelta + "</span>";
      var kdaBubble = "<span class='" + kdaClass + "' style='display:inline-block; padding:5px; margin:0 2px'>KDA Δ " + kdadelta + "</span>";
      var d2ptBubble = "<span class='" + d2ptClass + "' style='display:inline-block; padding:5px; margin:0 2px'>D2PT Δ " + d2ptdelta + "</span>";
      var nw10delta = (nb1nw10 - nb2nw10).toFixed(0);
      var nw10Class = (nw10delta > 0) ? 'alert alert-success' : 'alert alert-danger';
      var nw10Bubble = "<span class='" + nw10Class + "' style='display:inline-block; padding:5px; margin:0 2px'>NW10 Δ " + nw10delta + "</span>";
      $('#total').html("<div class='col-md-12 col-xs-12' style='text-align:center'>" + wrBubble + "&nbsp;&nbsp;" + kdaBubble + "&nbsp;&nbsp;" + d2ptBubble + "&nbsp;&nbsp;" + nw10Bubble + "</div>");
    }
    

    // lets add indexes (hero ids) first
    for (var i in advantages)
      advantages[i] = [advantages[i], i];

    advantages.sort (function (l, r) {
      return l[0] < r[0] ? -1 : 1;
    });
    this.showAdvantages ('best-picks',
                          advantages.slice (0, advantages.length / 2));

    this.showAdvantages ('worse-picks',
                          advantages.reverse ().slice (0, advantages.length / 2));

    $('#counters').scrollTop (0);
  }

});



var AppRouter = Backbone.Router.extend ({

  initialize: function () {
    this.route (/^(.*?)$/, 'sozdeHerolar');
    this.route (/^about$/, 'about');
  },

  sozdeHerolar: function (heroSelection) {
    if (DotaBuffCP.initialized)
      return;
    else
      DotaBuffCP.initialize ();

    var mainView = new MainView ();

    if (_.isNull (heroSelection))
      return;

    heroSelection = heroSelection.replace (/_/g, ' ');
    var selectedHeroes = heroSelection.split ('/');

    for (var i in selectedHeroes) {

      if (i > 4)
        break;

      if (_.isEmpty (selectedHeroes[i]))
        continue;

      var hid = DotaBuffCP.heroId (selectedHeroes[i]);

      if (hid == -1)
        continue;

      DotaBuffCP.lineup[i] = hid;
      mainView.addHeroToIndex (hid, i);
    }

    mainView.calculateAndShow ();
  },

  about: function () {
    $('#main-container').html (_.template ($('#about-page').html (),
                                           { version: DotaBuffCP.VERSION,
                                             last_update: update_time }));
    DotaBuffCP.initialized = false;
  }

});


$(document).ready (function () {
  // set version
  $('#version').text (DotaBuffCP.getVersion ());

  var appRouter = new AppRouter ();

  Backbone.history.start ({ pushState: false, root: '/dotabuffcp/' });
});

