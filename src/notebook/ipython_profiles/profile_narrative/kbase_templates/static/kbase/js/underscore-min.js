


<!DOCTYPE html>
<html>
  <head prefix="og: http://ogp.me/ns# fb: http://ogp.me/ns/fb# githubog: http://ogp.me/ns/fb/githubog#">
    <meta charset='utf-8'>
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <title>underscore/underscore-min.js at master · jashkenas/underscore</title>
    <link rel="search" type="application/opensearchdescription+xml" href="/opensearch.xml" title="GitHub" />
    <link rel="fluid-icon" href="https://github.com/fluidicon.png" title="GitHub" />
    <link rel="apple-touch-icon" sizes="57x57" href="/apple-touch-icon-114.png" />
    <link rel="apple-touch-icon" sizes="114x114" href="/apple-touch-icon-114.png" />
    <link rel="apple-touch-icon" sizes="72x72" href="/apple-touch-icon-144.png" />
    <link rel="apple-touch-icon" sizes="144x144" href="/apple-touch-icon-144.png" />
    <link rel="logo" type="image/svg" href="https://github-media-downloads.s3.amazonaws.com/github-logo.svg" />
    <meta property="og:image" content="https://github.global.ssl.fastly.net/images/modules/logos_page/Octocat.png">
    <meta name="hostname" content="github-fe132-cp1-prd.iad.github.net">
    <meta name="ruby" content="ruby 1.9.3p194-tcs-github-tcmalloc (2012-05-25, TCS patched 2012-05-27, GitHub v1.0.36) [x86_64-linux]">
    <link rel="assets" href="https://github.global.ssl.fastly.net/">
    <link rel="conduit-xhr" href="https://ghconduit.com:25035/">
    <link rel="xhr-socket" href="/_sockets" />
    


    <meta name="msapplication-TileImage" content="/windows-tile.png" />
    <meta name="msapplication-TileColor" content="#ffffff" />
    <meta name="selected-link" value="repo_source" data-pjax-transient />
    <meta content="collector.githubapp.com" name="octolytics-host" /><meta content="github" name="octolytics-app-id" /><meta content="45B53223:78F3:24E4BD0:524F2AEB" name="octolytics-dimension-request_id" /><meta content="1479353" name="octolytics-actor-id" /><meta content="sychan" name="octolytics-actor-login" /><meta content="59a0c55f26d03a9b89187613cad28e009a7227c34739a3c7d63b36aee3476eaa" name="octolytics-actor-hash" />
    

    
    
    <link rel="icon" type="image/x-icon" href="/favicon.ico" />

    <meta content="authenticity_token" name="csrf-param" />
<meta content="HuPa4q4nRjMykEAd8/t5XpRDU3DvairUIVAhpOz2Iyo=" name="csrf-token" />

    <link href="https://github.global.ssl.fastly.net/assets/github-05a75a572a86cfef8425f698ed0e5b891f24118e.css" media="all" rel="stylesheet" type="text/css" />
    <link href="https://github.global.ssl.fastly.net/assets/github2-5270ba98127dece0c192c0a6c0aa3d40b92efaf0.css" media="all" rel="stylesheet" type="text/css" />
    

    

      <script src="https://github.global.ssl.fastly.net/assets/frameworks-c4f8e49c5f967e72dd0ab79195971321e5adb6cc.js" type="text/javascript"></script>
      <script src="https://github.global.ssl.fastly.net/assets/github-4c1ed99b69d256c6b0fb6253d24e3b8e9a161c14.js" type="text/javascript"></script>
      
      <meta http-equiv="x-pjax-version" content="c45931cd594da468a1410fe98f97fff6">

        <link data-pjax-transient rel='permalink' href='/jashkenas/underscore/blob/dc3efb2aa4016af06e12f2c4c9abc776e239d41b/underscore-min.js'>
  <meta property="og:title" content="underscore"/>
  <meta property="og:type" content="githubog:gitrepository"/>
  <meta property="og:url" content="https://github.com/jashkenas/underscore"/>
  <meta property="og:image" content="https://github.global.ssl.fastly.net/images/gravatars/gravatar-user-420.png"/>
  <meta property="og:site_name" content="GitHub"/>
  <meta property="og:description" content="underscore - JavaScript&#39;s utility _ belt"/>

  <meta name="description" content="underscore - JavaScript&#39;s utility _ belt" />

  <meta content="4732" name="octolytics-dimension-user_id" /><meta content="jashkenas" name="octolytics-dimension-user_login" /><meta content="349241" name="octolytics-dimension-repository_id" /><meta content="jashkenas/underscore" name="octolytics-dimension-repository_nwo" /><meta content="true" name="octolytics-dimension-repository_public" /><meta content="false" name="octolytics-dimension-repository_is_fork" /><meta content="349241" name="octolytics-dimension-repository_network_root_id" /><meta content="jashkenas/underscore" name="octolytics-dimension-repository_network_root_nwo" />
  <link href="https://github.com/jashkenas/underscore/commits/master.atom" rel="alternate" title="Recent Commits to underscore:master" type="application/atom+xml" />

  </head>


  <body class="logged_in  env-production macintosh vis-public  page-blob">
    <div class="wrapper">
      
      
      


      <div class="header header-logged-in true">
  <div class="container clearfix">

    <a class="header-logo-invertocat" href="https://github.com/">
  <span class="mega-octicon octicon-mark-github"></span>
</a>

    
    <a href="/notifications" class="notification-indicator tooltipped downwards" data-gotokey="n" title="You have unread notifications">
        <span class="mail-status unread"></span>
</a>

      <div class="command-bar js-command-bar  in-repository">
          <form accept-charset="UTF-8" action="/search" class="command-bar-form" id="top_search_form" method="get">

<input type="text" data-hotkey="/ s" name="q" id="js-command-bar-field" placeholder="Search or type a command" tabindex="1" autocapitalize="off"
    
    data-username="sychan"
      data-repo="jashkenas/underscore"
      data-branch="master"
      data-sha="60fe99d71a7d38b3c3deb53b6110a3906243861a"
  >

    <input type="hidden" name="nwo" value="jashkenas/underscore" />

    <div class="select-menu js-menu-container js-select-menu search-context-select-menu">
      <span class="minibutton select-menu-button js-menu-target">
        <span class="js-select-button">This repository</span>
      </span>

      <div class="select-menu-modal-holder js-menu-content js-navigation-container">
        <div class="select-menu-modal">

          <div class="select-menu-item js-navigation-item js-this-repository-navigation-item selected">
            <span class="select-menu-item-icon octicon octicon-check"></span>
            <input type="radio" class="js-search-this-repository" name="search_target" value="repository" checked="checked" />
            <div class="select-menu-item-text js-select-button-text">This repository</div>
          </div> <!-- /.select-menu-item -->

          <div class="select-menu-item js-navigation-item js-all-repositories-navigation-item">
            <span class="select-menu-item-icon octicon octicon-check"></span>
            <input type="radio" name="search_target" value="global" />
            <div class="select-menu-item-text js-select-button-text">All repositories</div>
          </div> <!-- /.select-menu-item -->

        </div>
      </div>
    </div>

  <span class="octicon help tooltipped downwards" title="Show command bar help">
    <span class="octicon octicon-question"></span>
  </span>


  <input type="hidden" name="ref" value="cmdform">

</form>
        <ul class="top-nav">
          <li class="explore"><a href="/explore">Explore</a></li>
            <li><a href="https://gist.github.com">Gist</a></li>
            <li><a href="/blog">Blog</a></li>
          <li><a href="https://help.github.com">Help</a></li>
        </ul>
      </div>

    


  <ul id="user-links">
    <li>
      <a href="/sychan" class="name">
        <img height="20" src="https://2.gravatar.com/avatar/59aca2117b509b4fa1e695d779a1e728?d=https%3A%2F%2Fidenticons.github.com%2F8b7e63bcd18a4f21795f610494ec7be8.png&amp;s=140" width="20" /> sychan
      </a>
    </li>

      <li>
        <a href="/new" id="new_repo" class="tooltipped downwards" title="Create a new repo" aria-label="Create a new repo">
          <span class="octicon octicon-repo-create"></span>
        </a>
      </li>

      <li>
        <a href="/settings/profile" id="account_settings"
          class="tooltipped downwards"
          aria-label="Account settings "
          title="Account settings ">
          <span class="octicon octicon-tools"></span>
        </a>
      </li>
      <li>
        <a class="tooltipped downwards" href="/logout" data-method="post" id="logout" title="Sign out" aria-label="Sign out">
          <span class="octicon octicon-log-out"></span>
        </a>
      </li>

  </ul>

<div class="js-new-dropdown-contents hidden">
  

<ul class="dropdown-menu">
  <li>
    <a href="/new"><span class="octicon octicon-repo-create"></span> New repository</a>
  </li>
  <li>
    <a href="/organizations/new"><span class="octicon octicon-organization"></span> New organization</a>
  </li>



    <li class="section-title">
      <span title="jashkenas/underscore">This repository</span>
    </li>
    <li>
      <a href="/jashkenas/underscore/issues/new"><span class="octicon octicon-issue-opened"></span> New issue</a>
    </li>
</ul>

</div>


    
  </div>
</div>

      

      




          <div class="site" itemscope itemtype="http://schema.org/WebPage">
    
    <div class="pagehead repohead instapaper_ignore readability-menu">
      <div class="container">
        

<ul class="pagehead-actions">

    <li class="subscription">
      <form accept-charset="UTF-8" action="/notifications/subscribe" class="js-social-container" data-autosubmit="true" data-remote="true" method="post"><div style="margin:0;padding:0;display:inline"><input name="authenticity_token" type="hidden" value="HuPa4q4nRjMykEAd8/t5XpRDU3DvairUIVAhpOz2Iyo=" /></div>  <input id="repository_id" name="repository_id" type="hidden" value="349241" />

    <div class="select-menu js-menu-container js-select-menu">
        <a class="social-count js-social-count" href="/jashkenas/underscore/watchers">
          543
        </a>
      <span class="minibutton select-menu-button with-count js-menu-target" role="button" tabindex="0">
        <span class="js-select-button">
          <span class="octicon octicon-eye-watch"></span>
          Watch
        </span>
      </span>

      <div class="select-menu-modal-holder">
        <div class="select-menu-modal subscription-menu-modal js-menu-content">
          <div class="select-menu-header">
            <span class="select-menu-title">Notification status</span>
            <span class="octicon octicon-remove-close js-menu-close"></span>
          </div> <!-- /.select-menu-header -->

          <div class="select-menu-list js-navigation-container" role="menu">

            <div class="select-menu-item js-navigation-item selected" role="menuitem" tabindex="0">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <div class="select-menu-item-text">
                <input checked="checked" id="do_included" name="do" type="radio" value="included" />
                <h4>Not watching</h4>
                <span class="description">You only receive notifications for discussions in which you participate or are @mentioned.</span>
                <span class="js-select-button-text hidden-select-button-text">
                  <span class="octicon octicon-eye-watch"></span>
                  Watch
                </span>
              </div>
            </div> <!-- /.select-menu-item -->

            <div class="select-menu-item js-navigation-item " role="menuitem" tabindex="0">
              <span class="select-menu-item-icon octicon octicon octicon-check"></span>
              <div class="select-menu-item-text">
                <input id="do_subscribed" name="do" type="radio" value="subscribed" />
                <h4>Watching</h4>
                <span class="description">You receive notifications for all discussions in this repository.</span>
                <span class="js-select-button-text hidden-select-button-text">
                  <span class="octicon octicon-eye-unwatch"></span>
                  Unwatch
                </span>
              </div>
            </div> <!-- /.select-menu-item -->

            <div class="select-menu-item js-navigation-item " role="menuitem" tabindex="0">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <div class="select-menu-item-text">
                <input id="do_ignore" name="do" type="radio" value="ignore" />
                <h4>Ignoring</h4>
                <span class="description">You do not receive any notifications for discussions in this repository.</span>
                <span class="js-select-button-text hidden-select-button-text">
                  <span class="octicon octicon-mute"></span>
                  Stop ignoring
                </span>
              </div>
            </div> <!-- /.select-menu-item -->

          </div> <!-- /.select-menu-list -->

        </div> <!-- /.select-menu-modal -->
      </div> <!-- /.select-menu-modal-holder -->
    </div> <!-- /.select-menu -->

</form>
    </li>

  <li>
  
<div class="js-toggler-container js-social-container starring-container ">
  <a href="/jashkenas/underscore/unstar" class="minibutton with-count js-toggler-target star-button starred upwards" title="Unstar this repo" data-remote="true" data-method="post" rel="nofollow">
    <span class="octicon octicon-star-delete"></span><span class="text">Unstar</span>
  </a>
  <a href="/jashkenas/underscore/star" class="minibutton with-count js-toggler-target star-button unstarred upwards" title="Star this repo" data-remote="true" data-method="post" rel="nofollow">
    <span class="octicon octicon-star"></span><span class="text">Star</span>
  </a>
  <a class="social-count js-social-count" href="/jashkenas/underscore/stargazers">9,440</a>
</div>

  </li>


        <li>
          <a href="/jashkenas/underscore/fork" class="minibutton with-count js-toggler-target fork-button lighter upwards" title="Fork this repo" rel="facebox nofollow">
            <span class="octicon octicon-git-branch-create"></span><span class="text">Fork</span>
          </a>
          <a href="/jashkenas/underscore/network" class="social-count">1,717</a>
        </li>


</ul>

        <h1 itemscope itemtype="http://data-vocabulary.org/Breadcrumb" class="entry-title public">
          <span class="repo-label"><span>public</span></span>
          <span class="mega-octicon octicon-repo"></span>
          <span class="author">
            <a href="/jashkenas" class="url fn" itemprop="url" rel="author"><span itemprop="title">jashkenas</span></a></span
          ><span class="repohead-name-divider">/</span><strong
          ><a href="/jashkenas/underscore" class="js-current-repository js-repo-home-link">underscore</a></strong>

          <span class="page-context-loader">
            <img alt="Octocat-spinner-32" height="16" src="https://github.global.ssl.fastly.net/images/spinners/octocat-spinner-32.gif" width="16" />
          </span>

        </h1>
      </div><!-- /.container -->
    </div><!-- /.repohead -->

    <div class="container">

      <div class="repository-with-sidebar repo-container ">

        <div class="repository-sidebar">
            

<div class="repo-nav repo-nav-full js-repository-container-pjax js-octicon-loaders">
  <div class="repo-nav-contents">
    <ul class="repo-menu">
      <li class="tooltipped leftwards" title="Code">
        <a href="/jashkenas/underscore" aria-label="Code" class="js-selected-navigation-item selected" data-gotokey="c" data-pjax="true" data-selected-links="repo_source repo_downloads repo_commits repo_tags repo_branches /jashkenas/underscore">
          <span class="octicon octicon-code"></span> <span class="full-word">Code</span>
          <img alt="Octocat-spinner-32" class="mini-loader" height="16" src="https://github.global.ssl.fastly.net/images/spinners/octocat-spinner-32.gif" width="16" />
</a>      </li>

        <li class="tooltipped leftwards" title="Issues">
          <a href="/jashkenas/underscore/issues" aria-label="Issues" class="js-selected-navigation-item js-disable-pjax" data-gotokey="i" data-selected-links="repo_issues /jashkenas/underscore/issues">
            <span class="octicon octicon-issue-opened"></span> <span class="full-word">Issues</span>
            <span class='counter'>5</span>
            <img alt="Octocat-spinner-32" class="mini-loader" height="16" src="https://github.global.ssl.fastly.net/images/spinners/octocat-spinner-32.gif" width="16" />
</a>        </li>

      <li class="tooltipped leftwards" title="Pull Requests"><a href="/jashkenas/underscore/pulls" aria-label="Pull Requests" class="js-selected-navigation-item js-disable-pjax" data-gotokey="p" data-selected-links="repo_pulls /jashkenas/underscore/pulls">
            <span class="octicon octicon-git-pull-request"></span> <span class="full-word">Pull Requests</span>
            <span class='counter'>3</span>
            <img alt="Octocat-spinner-32" class="mini-loader" height="16" src="https://github.global.ssl.fastly.net/images/spinners/octocat-spinner-32.gif" width="16" />
</a>      </li>


        <li class="tooltipped leftwards" title="Wiki">
          <a href="/jashkenas/underscore/wiki" aria-label="Wiki" class="js-selected-navigation-item " data-pjax="true" data-selected-links="repo_wiki /jashkenas/underscore/wiki">
            <span class="octicon octicon-book"></span> <span class="full-word">Wiki</span>
            <img alt="Octocat-spinner-32" class="mini-loader" height="16" src="https://github.global.ssl.fastly.net/images/spinners/octocat-spinner-32.gif" width="16" />
</a>        </li>
    </ul>
    <div class="repo-menu-separator"></div>
    <ul class="repo-menu">

      <li class="tooltipped leftwards" title="Pulse">
        <a href="/jashkenas/underscore/pulse" aria-label="Pulse" class="js-selected-navigation-item " data-pjax="true" data-selected-links="pulse /jashkenas/underscore/pulse">
          <span class="octicon octicon-pulse"></span> <span class="full-word">Pulse</span>
          <img alt="Octocat-spinner-32" class="mini-loader" height="16" src="https://github.global.ssl.fastly.net/images/spinners/octocat-spinner-32.gif" width="16" />
</a>      </li>

      <li class="tooltipped leftwards" title="Graphs">
        <a href="/jashkenas/underscore/graphs" aria-label="Graphs" class="js-selected-navigation-item " data-pjax="true" data-selected-links="repo_graphs repo_contributors /jashkenas/underscore/graphs">
          <span class="octicon octicon-graph"></span> <span class="full-word">Graphs</span>
          <img alt="Octocat-spinner-32" class="mini-loader" height="16" src="https://github.global.ssl.fastly.net/images/spinners/octocat-spinner-32.gif" width="16" />
</a>      </li>

      <li class="tooltipped leftwards" title="Network">
        <a href="/jashkenas/underscore/network" aria-label="Network" class="js-selected-navigation-item js-disable-pjax" data-selected-links="repo_network /jashkenas/underscore/network">
          <span class="octicon octicon-git-branch"></span> <span class="full-word">Network</span>
          <img alt="Octocat-spinner-32" class="mini-loader" height="16" src="https://github.global.ssl.fastly.net/images/spinners/octocat-spinner-32.gif" width="16" />
</a>      </li>
    </ul>


  </div>
</div>

            <div class="only-with-full-nav">
              

  

<div class="clone-url open"
  data-protocol-type="http"
  data-url="/users/set_protocol?protocol_selector=http&amp;protocol_type=clone">
  <h3><strong>HTTPS</strong> clone URL</h3>
  <div class="clone-url-box">
    <input type="text" class="clone js-url-field"
           value="https://github.com/jashkenas/underscore.git" readonly="readonly">

    <span class="js-zeroclipboard url-box-clippy minibutton zeroclipboard-button" data-clipboard-text="https://github.com/jashkenas/underscore.git" data-copied-hint="copied!" title="copy to clipboard"><span class="octicon octicon-clippy"></span></span>
  </div>
</div>

  

<div class="clone-url "
  data-protocol-type="ssh"
  data-url="/users/set_protocol?protocol_selector=ssh&amp;protocol_type=clone">
  <h3><strong>SSH</strong> clone URL</h3>
  <div class="clone-url-box">
    <input type="text" class="clone js-url-field"
           value="git@github.com:jashkenas/underscore.git" readonly="readonly">

    <span class="js-zeroclipboard url-box-clippy minibutton zeroclipboard-button" data-clipboard-text="git@github.com:jashkenas/underscore.git" data-copied-hint="copied!" title="copy to clipboard"><span class="octicon octicon-clippy"></span></span>
  </div>
</div>

  

<div class="clone-url "
  data-protocol-type="subversion"
  data-url="/users/set_protocol?protocol_selector=subversion&amp;protocol_type=clone">
  <h3><strong>Subversion</strong> checkout URL</h3>
  <div class="clone-url-box">
    <input type="text" class="clone js-url-field"
           value="https://github.com/jashkenas/underscore" readonly="readonly">

    <span class="js-zeroclipboard url-box-clippy minibutton zeroclipboard-button" data-clipboard-text="https://github.com/jashkenas/underscore" data-copied-hint="copied!" title="copy to clipboard"><span class="octicon octicon-clippy"></span></span>
  </div>
</div>


<p class="clone-options">You can clone with
      <a href="#" class="js-clone-selector" data-protocol="http">HTTPS</a>,
      <a href="#" class="js-clone-selector" data-protocol="ssh">SSH</a>,
      or <a href="#" class="js-clone-selector" data-protocol="subversion">Subversion</a>.
  <span class="octicon help tooltipped upwards" title="Get help on which URL is right for you.">
    <a href="https://help.github.com/articles/which-remote-url-should-i-use">
    <span class="octicon octicon-question"></span>
    </a>
  </span>
</p>

  <a href="http://mac.github.com" data-url="github-mac://openRepo/https://github.com/jashkenas/underscore" class="minibutton sidebar-button js-conduit-rewrite-url">
    <span class="octicon octicon-device-desktop"></span>
    Clone in Desktop
  </a>


              <a href="/jashkenas/underscore/archive/master.zip"
                 class="minibutton sidebar-button"
                 title="Download this repository as a zip file"
                 rel="nofollow">
                <span class="octicon octicon-cloud-download"></span>
                Download ZIP
              </a>
            </div>
        </div><!-- /.repository-sidebar -->

        <div id="js-repo-pjax-container" class="repository-content context-loader-container" data-pjax-container>
          


<!-- blob contrib key: blob_contributors:v21:c43b2f068dce8f9cd016aca5e1d6f62c -->

<p title="This is a placeholder element" class="js-history-link-replace hidden"></p>

<a href="/jashkenas/underscore/find/master" data-pjax data-hotkey="t" class="js-show-file-finder" style="display:none">Show File Finder</a>

<div class="file-navigation">
  


<div class="select-menu js-menu-container js-select-menu" >
  <span class="minibutton select-menu-button js-menu-target" data-hotkey="w"
    data-master-branch="master"
    data-ref="master"
    role="button" aria-label="Switch branches or tags" tabindex="0">
    <span class="octicon octicon-git-branch"></span>
    <i>branch:</i>
    <span class="js-select-button">master</span>
  </span>

  <div class="select-menu-modal-holder js-menu-content js-navigation-container" data-pjax>

    <div class="select-menu-modal">
      <div class="select-menu-header">
        <span class="select-menu-title">Switch branches/tags</span>
        <span class="octicon octicon-remove-close js-menu-close"></span>
      </div> <!-- /.select-menu-header -->

      <div class="select-menu-filters">
        <div class="select-menu-text-filter">
          <input type="text" aria-label="Filter branches/tags" id="context-commitish-filter-field" class="js-filterable-field js-navigation-enable" placeholder="Filter branches/tags">
        </div>
        <div class="select-menu-tabs">
          <ul>
            <li class="select-menu-tab">
              <a href="#" data-tab-filter="branches" class="js-select-menu-tab">Branches</a>
            </li>
            <li class="select-menu-tab">
              <a href="#" data-tab-filter="tags" class="js-select-menu-tab">Tags</a>
            </li>
          </ul>
        </div><!-- /.select-menu-tabs -->
      </div><!-- /.select-menu-filters -->

      <div class="select-menu-list select-menu-tab-bucket js-select-menu-tab-bucket" data-tab-filter="branches">

        <div data-filterable-for="context-commitish-filter-field" data-filterable-type="substring">


            <div class="select-menu-item js-navigation-item ">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <a href="/jashkenas/underscore/blob/async/underscore-min.js"
                 data-name="async"
                 data-skip-pjax="true"
                 rel="nofollow"
                 class="js-navigation-open select-menu-item-text js-select-button-text css-truncate-target"
                 title="async">async</a>
            </div> <!-- /.select-menu-item -->
            <div class="select-menu-item js-navigation-item ">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <a href="/jashkenas/underscore/blob/gh-pages/underscore-min.js"
                 data-name="gh-pages"
                 data-skip-pjax="true"
                 rel="nofollow"
                 class="js-navigation-open select-menu-item-text js-select-button-text css-truncate-target"
                 title="gh-pages">gh-pages</a>
            </div> <!-- /.select-menu-item -->
            <div class="select-menu-item js-navigation-item selected">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <a href="/jashkenas/underscore/blob/master/underscore-min.js"
                 data-name="master"
                 data-skip-pjax="true"
                 rel="nofollow"
                 class="js-navigation-open select-menu-item-text js-select-button-text css-truncate-target"
                 title="master">master</a>
            </div> <!-- /.select-menu-item -->
        </div>

          <div class="select-menu-no-results">Nothing to show</div>
      </div> <!-- /.select-menu-list -->

      <div class="select-menu-list select-menu-tab-bucket js-select-menu-tab-bucket" data-tab-filter="tags">
        <div data-filterable-for="context-commitish-filter-field" data-filterable-type="substring">


            <div class="select-menu-item js-navigation-item ">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <a href="/jashkenas/underscore/tree/1.5.2/underscore-min.js"
                 data-name="1.5.2"
                 data-skip-pjax="true"
                 rel="nofollow"
                 class="js-navigation-open select-menu-item-text js-select-button-text css-truncate-target"
                 title="1.5.2">1.5.2</a>
            </div> <!-- /.select-menu-item -->
            <div class="select-menu-item js-navigation-item ">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <a href="/jashkenas/underscore/tree/1.5.1/underscore-min.js"
                 data-name="1.5.1"
                 data-skip-pjax="true"
                 rel="nofollow"
                 class="js-navigation-open select-menu-item-text js-select-button-text css-truncate-target"
                 title="1.5.1">1.5.1</a>
            </div> <!-- /.select-menu-item -->
            <div class="select-menu-item js-navigation-item ">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <a href="/jashkenas/underscore/tree/1.5.0/underscore-min.js"
                 data-name="1.5.0"
                 data-skip-pjax="true"
                 rel="nofollow"
                 class="js-navigation-open select-menu-item-text js-select-button-text css-truncate-target"
                 title="1.5.0">1.5.0</a>
            </div> <!-- /.select-menu-item -->
            <div class="select-menu-item js-navigation-item ">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <a href="/jashkenas/underscore/tree/1.4.4/underscore-min.js"
                 data-name="1.4.4"
                 data-skip-pjax="true"
                 rel="nofollow"
                 class="js-navigation-open select-menu-item-text js-select-button-text css-truncate-target"
                 title="1.4.4">1.4.4</a>
            </div> <!-- /.select-menu-item -->
            <div class="select-menu-item js-navigation-item ">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <a href="/jashkenas/underscore/tree/1.4.3/underscore-min.js"
                 data-name="1.4.3"
                 data-skip-pjax="true"
                 rel="nofollow"
                 class="js-navigation-open select-menu-item-text js-select-button-text css-truncate-target"
                 title="1.4.3">1.4.3</a>
            </div> <!-- /.select-menu-item -->
            <div class="select-menu-item js-navigation-item ">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <a href="/jashkenas/underscore/tree/1.4.2/underscore-min.js"
                 data-name="1.4.2"
                 data-skip-pjax="true"
                 rel="nofollow"
                 class="js-navigation-open select-menu-item-text js-select-button-text css-truncate-target"
                 title="1.4.2">1.4.2</a>
            </div> <!-- /.select-menu-item -->
            <div class="select-menu-item js-navigation-item ">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <a href="/jashkenas/underscore/tree/1.4.1/underscore-min.js"
                 data-name="1.4.1"
                 data-skip-pjax="true"
                 rel="nofollow"
                 class="js-navigation-open select-menu-item-text js-select-button-text css-truncate-target"
                 title="1.4.1">1.4.1</a>
            </div> <!-- /.select-menu-item -->
            <div class="select-menu-item js-navigation-item ">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <a href="/jashkenas/underscore/tree/1.4.0/underscore-min.js"
                 data-name="1.4.0"
                 data-skip-pjax="true"
                 rel="nofollow"
                 class="js-navigation-open select-menu-item-text js-select-button-text css-truncate-target"
                 title="1.4.0">1.4.0</a>
            </div> <!-- /.select-menu-item -->
            <div class="select-menu-item js-navigation-item ">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <a href="/jashkenas/underscore/tree/1.3.3/underscore-min.js"
                 data-name="1.3.3"
                 data-skip-pjax="true"
                 rel="nofollow"
                 class="js-navigation-open select-menu-item-text js-select-button-text css-truncate-target"
                 title="1.3.3">1.3.3</a>
            </div> <!-- /.select-menu-item -->
            <div class="select-menu-item js-navigation-item ">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <a href="/jashkenas/underscore/tree/1.3.2/underscore-min.js"
                 data-name="1.3.2"
                 data-skip-pjax="true"
                 rel="nofollow"
                 class="js-navigation-open select-menu-item-text js-select-button-text css-truncate-target"
                 title="1.3.2">1.3.2</a>
            </div> <!-- /.select-menu-item -->
            <div class="select-menu-item js-navigation-item ">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <a href="/jashkenas/underscore/tree/1.3.1/underscore-min.js"
                 data-name="1.3.1"
                 data-skip-pjax="true"
                 rel="nofollow"
                 class="js-navigation-open select-menu-item-text js-select-button-text css-truncate-target"
                 title="1.3.1">1.3.1</a>
            </div> <!-- /.select-menu-item -->
            <div class="select-menu-item js-navigation-item ">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <a href="/jashkenas/underscore/tree/1.3.0/underscore-min.js"
                 data-name="1.3.0"
                 data-skip-pjax="true"
                 rel="nofollow"
                 class="js-navigation-open select-menu-item-text js-select-button-text css-truncate-target"
                 title="1.3.0">1.3.0</a>
            </div> <!-- /.select-menu-item -->
            <div class="select-menu-item js-navigation-item ">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <a href="/jashkenas/underscore/tree/1.2.4/underscore-min.js"
                 data-name="1.2.4"
                 data-skip-pjax="true"
                 rel="nofollow"
                 class="js-navigation-open select-menu-item-text js-select-button-text css-truncate-target"
                 title="1.2.4">1.2.4</a>
            </div> <!-- /.select-menu-item -->
            <div class="select-menu-item js-navigation-item ">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <a href="/jashkenas/underscore/tree/1.2.3/underscore-min.js"
                 data-name="1.2.3"
                 data-skip-pjax="true"
                 rel="nofollow"
                 class="js-navigation-open select-menu-item-text js-select-button-text css-truncate-target"
                 title="1.2.3">1.2.3</a>
            </div> <!-- /.select-menu-item -->
            <div class="select-menu-item js-navigation-item ">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <a href="/jashkenas/underscore/tree/1.2.2/underscore-min.js"
                 data-name="1.2.2"
                 data-skip-pjax="true"
                 rel="nofollow"
                 class="js-navigation-open select-menu-item-text js-select-button-text css-truncate-target"
                 title="1.2.2">1.2.2</a>
            </div> <!-- /.select-menu-item -->
            <div class="select-menu-item js-navigation-item ">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <a href="/jashkenas/underscore/tree/1.2.1/underscore-min.js"
                 data-name="1.2.1"
                 data-skip-pjax="true"
                 rel="nofollow"
                 class="js-navigation-open select-menu-item-text js-select-button-text css-truncate-target"
                 title="1.2.1">1.2.1</a>
            </div> <!-- /.select-menu-item -->
            <div class="select-menu-item js-navigation-item ">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <a href="/jashkenas/underscore/tree/1.2.0/underscore-min.js"
                 data-name="1.2.0"
                 data-skip-pjax="true"
                 rel="nofollow"
                 class="js-navigation-open select-menu-item-text js-select-button-text css-truncate-target"
                 title="1.2.0">1.2.0</a>
            </div> <!-- /.select-menu-item -->
            <div class="select-menu-item js-navigation-item ">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <a href="/jashkenas/underscore/tree/1.1.7/underscore-min.js"
                 data-name="1.1.7"
                 data-skip-pjax="true"
                 rel="nofollow"
                 class="js-navigation-open select-menu-item-text js-select-button-text css-truncate-target"
                 title="1.1.7">1.1.7</a>
            </div> <!-- /.select-menu-item -->
            <div class="select-menu-item js-navigation-item ">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <a href="/jashkenas/underscore/tree/1.1.6/underscore-min.js"
                 data-name="1.1.6"
                 data-skip-pjax="true"
                 rel="nofollow"
                 class="js-navigation-open select-menu-item-text js-select-button-text css-truncate-target"
                 title="1.1.6">1.1.6</a>
            </div> <!-- /.select-menu-item -->
            <div class="select-menu-item js-navigation-item ">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <a href="/jashkenas/underscore/tree/1.1.5/underscore-min.js"
                 data-name="1.1.5"
                 data-skip-pjax="true"
                 rel="nofollow"
                 class="js-navigation-open select-menu-item-text js-select-button-text css-truncate-target"
                 title="1.1.5">1.1.5</a>
            </div> <!-- /.select-menu-item -->
            <div class="select-menu-item js-navigation-item ">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <a href="/jashkenas/underscore/tree/1.1.4/underscore-min.js"
                 data-name="1.1.4"
                 data-skip-pjax="true"
                 rel="nofollow"
                 class="js-navigation-open select-menu-item-text js-select-button-text css-truncate-target"
                 title="1.1.4">1.1.4</a>
            </div> <!-- /.select-menu-item -->
            <div class="select-menu-item js-navigation-item ">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <a href="/jashkenas/underscore/tree/1.1.3/underscore-min.js"
                 data-name="1.1.3"
                 data-skip-pjax="true"
                 rel="nofollow"
                 class="js-navigation-open select-menu-item-text js-select-button-text css-truncate-target"
                 title="1.1.3">1.1.3</a>
            </div> <!-- /.select-menu-item -->
            <div class="select-menu-item js-navigation-item ">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <a href="/jashkenas/underscore/tree/1.1.2/underscore-min.js"
                 data-name="1.1.2"
                 data-skip-pjax="true"
                 rel="nofollow"
                 class="js-navigation-open select-menu-item-text js-select-button-text css-truncate-target"
                 title="1.1.2">1.1.2</a>
            </div> <!-- /.select-menu-item -->
            <div class="select-menu-item js-navigation-item ">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <a href="/jashkenas/underscore/tree/1.1.1/underscore-min.js"
                 data-name="1.1.1"
                 data-skip-pjax="true"
                 rel="nofollow"
                 class="js-navigation-open select-menu-item-text js-select-button-text css-truncate-target"
                 title="1.1.1">1.1.1</a>
            </div> <!-- /.select-menu-item -->
            <div class="select-menu-item js-navigation-item ">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <a href="/jashkenas/underscore/tree/1.1.0/underscore-min.js"
                 data-name="1.1.0"
                 data-skip-pjax="true"
                 rel="nofollow"
                 class="js-navigation-open select-menu-item-text js-select-button-text css-truncate-target"
                 title="1.1.0">1.1.0</a>
            </div> <!-- /.select-menu-item -->
            <div class="select-menu-item js-navigation-item ">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <a href="/jashkenas/underscore/tree/1.0.4/underscore-min.js"
                 data-name="1.0.4"
                 data-skip-pjax="true"
                 rel="nofollow"
                 class="js-navigation-open select-menu-item-text js-select-button-text css-truncate-target"
                 title="1.0.4">1.0.4</a>
            </div> <!-- /.select-menu-item -->
            <div class="select-menu-item js-navigation-item ">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <a href="/jashkenas/underscore/tree/1.0.3/underscore-min.js"
                 data-name="1.0.3"
                 data-skip-pjax="true"
                 rel="nofollow"
                 class="js-navigation-open select-menu-item-text js-select-button-text css-truncate-target"
                 title="1.0.3">1.0.3</a>
            </div> <!-- /.select-menu-item -->
            <div class="select-menu-item js-navigation-item ">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <a href="/jashkenas/underscore/tree/1.0.2/underscore-min.js"
                 data-name="1.0.2"
                 data-skip-pjax="true"
                 rel="nofollow"
                 class="js-navigation-open select-menu-item-text js-select-button-text css-truncate-target"
                 title="1.0.2">1.0.2</a>
            </div> <!-- /.select-menu-item -->
            <div class="select-menu-item js-navigation-item ">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <a href="/jashkenas/underscore/tree/1.0.1/underscore-min.js"
                 data-name="1.0.1"
                 data-skip-pjax="true"
                 rel="nofollow"
                 class="js-navigation-open select-menu-item-text js-select-button-text css-truncate-target"
                 title="1.0.1">1.0.1</a>
            </div> <!-- /.select-menu-item -->
            <div class="select-menu-item js-navigation-item ">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <a href="/jashkenas/underscore/tree/1.0.0/underscore-min.js"
                 data-name="1.0.0"
                 data-skip-pjax="true"
                 rel="nofollow"
                 class="js-navigation-open select-menu-item-text js-select-button-text css-truncate-target"
                 title="1.0.0">1.0.0</a>
            </div> <!-- /.select-menu-item -->
            <div class="select-menu-item js-navigation-item ">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <a href="/jashkenas/underscore/tree/0.6.0/underscore-min.js"
                 data-name="0.6.0"
                 data-skip-pjax="true"
                 rel="nofollow"
                 class="js-navigation-open select-menu-item-text js-select-button-text css-truncate-target"
                 title="0.6.0">0.6.0</a>
            </div> <!-- /.select-menu-item -->
            <div class="select-menu-item js-navigation-item ">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <a href="/jashkenas/underscore/tree/0.5.7/underscore-min.js"
                 data-name="0.5.7"
                 data-skip-pjax="true"
                 rel="nofollow"
                 class="js-navigation-open select-menu-item-text js-select-button-text css-truncate-target"
                 title="0.5.7">0.5.7</a>
            </div> <!-- /.select-menu-item -->
            <div class="select-menu-item js-navigation-item ">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <a href="/jashkenas/underscore/tree/0.5.5/underscore-min.js"
                 data-name="0.5.5"
                 data-skip-pjax="true"
                 rel="nofollow"
                 class="js-navigation-open select-menu-item-text js-select-button-text css-truncate-target"
                 title="0.5.5">0.5.5</a>
            </div> <!-- /.select-menu-item -->
            <div class="select-menu-item js-navigation-item ">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <a href="/jashkenas/underscore/tree/0.5.4/underscore-min.js"
                 data-name="0.5.4"
                 data-skip-pjax="true"
                 rel="nofollow"
                 class="js-navigation-open select-menu-item-text js-select-button-text css-truncate-target"
                 title="0.5.4">0.5.4</a>
            </div> <!-- /.select-menu-item -->
            <div class="select-menu-item js-navigation-item ">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <a href="/jashkenas/underscore/tree/0.5.3/underscore-min.js"
                 data-name="0.5.3"
                 data-skip-pjax="true"
                 rel="nofollow"
                 class="js-navigation-open select-menu-item-text js-select-button-text css-truncate-target"
                 title="0.5.3">0.5.3</a>
            </div> <!-- /.select-menu-item -->
            <div class="select-menu-item js-navigation-item ">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <a href="/jashkenas/underscore/tree/0.5.2/underscore-min.js"
                 data-name="0.5.2"
                 data-skip-pjax="true"
                 rel="nofollow"
                 class="js-navigation-open select-menu-item-text js-select-button-text css-truncate-target"
                 title="0.5.2">0.5.2</a>
            </div> <!-- /.select-menu-item -->
            <div class="select-menu-item js-navigation-item ">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <a href="/jashkenas/underscore/tree/0.5.1/underscore-min.js"
                 data-name="0.5.1"
                 data-skip-pjax="true"
                 rel="nofollow"
                 class="js-navigation-open select-menu-item-text js-select-button-text css-truncate-target"
                 title="0.5.1">0.5.1</a>
            </div> <!-- /.select-menu-item -->
            <div class="select-menu-item js-navigation-item ">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <a href="/jashkenas/underscore/tree/0.5.0/underscore-min.js"
                 data-name="0.5.0"
                 data-skip-pjax="true"
                 rel="nofollow"
                 class="js-navigation-open select-menu-item-text js-select-button-text css-truncate-target"
                 title="0.5.0">0.5.0</a>
            </div> <!-- /.select-menu-item -->
            <div class="select-menu-item js-navigation-item ">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <a href="/jashkenas/underscore/tree/0.4.7/underscore-min.js"
                 data-name="0.4.7"
                 data-skip-pjax="true"
                 rel="nofollow"
                 class="js-navigation-open select-menu-item-text js-select-button-text css-truncate-target"
                 title="0.4.7">0.4.7</a>
            </div> <!-- /.select-menu-item -->
            <div class="select-menu-item js-navigation-item ">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <a href="/jashkenas/underscore/tree/0.4.6/underscore-min.js"
                 data-name="0.4.6"
                 data-skip-pjax="true"
                 rel="nofollow"
                 class="js-navigation-open select-menu-item-text js-select-button-text css-truncate-target"
                 title="0.4.6">0.4.6</a>
            </div> <!-- /.select-menu-item -->
            <div class="select-menu-item js-navigation-item ">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <a href="/jashkenas/underscore/tree/0.4.5/underscore-min.js"
                 data-name="0.4.5"
                 data-skip-pjax="true"
                 rel="nofollow"
                 class="js-navigation-open select-menu-item-text js-select-button-text css-truncate-target"
                 title="0.4.5">0.4.5</a>
            </div> <!-- /.select-menu-item -->
            <div class="select-menu-item js-navigation-item ">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <a href="/jashkenas/underscore/tree/0.4.4/underscore-min.js"
                 data-name="0.4.4"
                 data-skip-pjax="true"
                 rel="nofollow"
                 class="js-navigation-open select-menu-item-text js-select-button-text css-truncate-target"
                 title="0.4.4">0.4.4</a>
            </div> <!-- /.select-menu-item -->
            <div class="select-menu-item js-navigation-item ">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <a href="/jashkenas/underscore/tree/0.4.3/underscore-min.js"
                 data-name="0.4.3"
                 data-skip-pjax="true"
                 rel="nofollow"
                 class="js-navigation-open select-menu-item-text js-select-button-text css-truncate-target"
                 title="0.4.3">0.4.3</a>
            </div> <!-- /.select-menu-item -->
            <div class="select-menu-item js-navigation-item ">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <a href="/jashkenas/underscore/tree/0.4.2/underscore-min.js"
                 data-name="0.4.2"
                 data-skip-pjax="true"
                 rel="nofollow"
                 class="js-navigation-open select-menu-item-text js-select-button-text css-truncate-target"
                 title="0.4.2">0.4.2</a>
            </div> <!-- /.select-menu-item -->
            <div class="select-menu-item js-navigation-item ">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <a href="/jashkenas/underscore/tree/0.4.1/underscore-min.js"
                 data-name="0.4.1"
                 data-skip-pjax="true"
                 rel="nofollow"
                 class="js-navigation-open select-menu-item-text js-select-button-text css-truncate-target"
                 title="0.4.1">0.4.1</a>
            </div> <!-- /.select-menu-item -->
            <div class="select-menu-item js-navigation-item ">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <a href="/jashkenas/underscore/tree/0.4.0/underscore-min.js"
                 data-name="0.4.0"
                 data-skip-pjax="true"
                 rel="nofollow"
                 class="js-navigation-open select-menu-item-text js-select-button-text css-truncate-target"
                 title="0.4.0">0.4.0</a>
            </div> <!-- /.select-menu-item -->
            <div class="select-menu-item js-navigation-item ">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <a href="/jashkenas/underscore/tree/0.3.3/underscore-min.js"
                 data-name="0.3.3"
                 data-skip-pjax="true"
                 rel="nofollow"
                 class="js-navigation-open select-menu-item-text js-select-button-text css-truncate-target"
                 title="0.3.3">0.3.3</a>
            </div> <!-- /.select-menu-item -->
            <div class="select-menu-item js-navigation-item ">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <a href="/jashkenas/underscore/tree/0.3.2/underscore-min.js"
                 data-name="0.3.2"
                 data-skip-pjax="true"
                 rel="nofollow"
                 class="js-navigation-open select-menu-item-text js-select-button-text css-truncate-target"
                 title="0.3.2">0.3.2</a>
            </div> <!-- /.select-menu-item -->
            <div class="select-menu-item js-navigation-item ">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <a href="/jashkenas/underscore/tree/0.3.1/underscore-min.js"
                 data-name="0.3.1"
                 data-skip-pjax="true"
                 rel="nofollow"
                 class="js-navigation-open select-menu-item-text js-select-button-text css-truncate-target"
                 title="0.3.1">0.3.1</a>
            </div> <!-- /.select-menu-item -->
            <div class="select-menu-item js-navigation-item ">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <a href="/jashkenas/underscore/tree/0.3.0/underscore-min.js"
                 data-name="0.3.0"
                 data-skip-pjax="true"
                 rel="nofollow"
                 class="js-navigation-open select-menu-item-text js-select-button-text css-truncate-target"
                 title="0.3.0">0.3.0</a>
            </div> <!-- /.select-menu-item -->
            <div class="select-menu-item js-navigation-item ">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <a href="/jashkenas/underscore/tree/0.2.0/underscore-min.js"
                 data-name="0.2.0"
                 data-skip-pjax="true"
                 rel="nofollow"
                 class="js-navigation-open select-menu-item-text js-select-button-text css-truncate-target"
                 title="0.2.0">0.2.0</a>
            </div> <!-- /.select-menu-item -->
            <div class="select-menu-item js-navigation-item ">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <a href="/jashkenas/underscore/tree/0.1.1/underscore-min.js"
                 data-name="0.1.1"
                 data-skip-pjax="true"
                 rel="nofollow"
                 class="js-navigation-open select-menu-item-text js-select-button-text css-truncate-target"
                 title="0.1.1">0.1.1</a>
            </div> <!-- /.select-menu-item -->
            <div class="select-menu-item js-navigation-item ">
              <span class="select-menu-item-icon octicon octicon-check"></span>
              <a href="/jashkenas/underscore/tree/0.1.0/underscore-min.js"
                 data-name="0.1.0"
                 data-skip-pjax="true"
                 rel="nofollow"
                 class="js-navigation-open select-menu-item-text js-select-button-text css-truncate-target"
                 title="0.1.0">0.1.0</a>
            </div> <!-- /.select-menu-item -->
        </div>

        <div class="select-menu-no-results">Nothing to show</div>
      </div> <!-- /.select-menu-list -->

    </div> <!-- /.select-menu-modal -->
  </div> <!-- /.select-menu-modal-holder -->
</div> <!-- /.select-menu -->

  <div class="breadcrumb">
    <span class='repo-root js-repo-root'><span itemscope="" itemtype="http://data-vocabulary.org/Breadcrumb"><a href="/jashkenas/underscore" data-branch="master" data-direction="back" data-pjax="true" itemscope="url"><span itemprop="title">underscore</span></a></span></span><span class="separator"> / </span><strong class="final-path">underscore-min.js</strong> <span class="js-zeroclipboard minibutton zeroclipboard-button" data-clipboard-text="underscore-min.js" data-copied-hint="copied!" title="copy to clipboard"><span class="octicon octicon-clippy"></span></span>
  </div>
</div>



  <div class="commit file-history-tease">
    <img class="main-avatar" height="24" src="https://0.gravatar.com/avatar/32652ed5b8fbd2ecdb1c78e9ac567b4b?d=https%3A%2F%2Fidenticons.github.com%2Ffd1d83de2517a02d4e221ede9a681432.png&amp;s=140" width="24" />
    <span class="author"><a href="/jashkenas" rel="author">jashkenas</a></span>
    <time class="js-relative-date" datetime="2013-09-07T05:58:21-07:00" title="2013-09-07 05:58:21">September 07, 2013</time>
    <div class="commit-title">
        <a href="/jashkenas/underscore/commit/101c10a60019fe870d21868835f65c25d64968fc" class="message" data-pjax="true" title="Underscore.js 1.5.2">Underscore.js 1.5.2</a>
    </div>

    <div class="participation">
      <p class="quickstat"><a href="#blob_contributors_box" rel="facebox"><strong>5</strong> contributors</a></p>
          <a class="avatar tooltipped downwards" title="jashkenas" href="/jashkenas/underscore/commits/master/underscore-min.js?author=jashkenas"><img height="20" src="https://0.gravatar.com/avatar/32652ed5b8fbd2ecdb1c78e9ac567b4b?d=https%3A%2F%2Fidenticons.github.com%2Ffd1d83de2517a02d4e221ede9a681432.png&amp;s=140" width="20" /></a>
    <a class="avatar tooltipped downwards" title="ryantenney" href="/jashkenas/underscore/commits/master/underscore-min.js?author=ryantenney"><img height="20" src="https://0.gravatar.com/avatar/4cfc9597de4269114d9457d02c5a57a5?d=https%3A%2F%2Fidenticons.github.com%2F05b8c1d212f60a76cbe14f877d944548.png&amp;s=140" width="20" /></a>
    <a class="avatar tooltipped downwards" title="jdalton" href="/jashkenas/underscore/commits/master/underscore-min.js?author=jdalton"><img height="20" src="https://2.gravatar.com/avatar/299a3d891ff1920b69c364d061007043?d=https%3A%2F%2Fidenticons.github.com%2Fb052e2e0c0ad1b2d5036bd56e27d061c.png&amp;s=140" width="20" /></a>
    <a class="avatar tooltipped downwards" title="creationix" href="/jashkenas/underscore/commits/master/underscore-min.js?author=creationix"><img height="20" src="https://2.gravatar.com/avatar/c953ddd239707998340e1a6fbb3eeb46?d=https%3A%2F%2Fidenticons.github.com%2F6e87e3566bf2a3c0b3dad33dd319b537.png&amp;s=140" width="20" /></a>
    <a class="avatar tooltipped downwards" title="rfletcher" href="/jashkenas/underscore/commits/master/underscore-min.js?author=rfletcher"><img height="20" src="https://1.gravatar.com/avatar/b1e65792c33ab7d44028dd0918e92d16?d=https%3A%2F%2Fidenticons.github.com%2Fab73535914798c3ad40ab8bea10188a4.png&amp;s=140" width="20" /></a>


    </div>
    <div id="blob_contributors_box" style="display:none">
      <h2 class="facebox-header">Users who have contributed to this file</h2>
      <ul class="facebox-user-list">
        <li class="facebox-user-list-item">
          <img height="24" src="https://0.gravatar.com/avatar/32652ed5b8fbd2ecdb1c78e9ac567b4b?d=https%3A%2F%2Fidenticons.github.com%2Ffd1d83de2517a02d4e221ede9a681432.png&amp;s=140" width="24" />
          <a href="/jashkenas">jashkenas</a>
        </li>
        <li class="facebox-user-list-item">
          <img height="24" src="https://0.gravatar.com/avatar/4cfc9597de4269114d9457d02c5a57a5?d=https%3A%2F%2Fidenticons.github.com%2F05b8c1d212f60a76cbe14f877d944548.png&amp;s=140" width="24" />
          <a href="/ryantenney">ryantenney</a>
        </li>
        <li class="facebox-user-list-item">
          <img height="24" src="https://2.gravatar.com/avatar/299a3d891ff1920b69c364d061007043?d=https%3A%2F%2Fidenticons.github.com%2Fb052e2e0c0ad1b2d5036bd56e27d061c.png&amp;s=140" width="24" />
          <a href="/jdalton">jdalton</a>
        </li>
        <li class="facebox-user-list-item">
          <img height="24" src="https://2.gravatar.com/avatar/c953ddd239707998340e1a6fbb3eeb46?d=https%3A%2F%2Fidenticons.github.com%2F6e87e3566bf2a3c0b3dad33dd319b537.png&amp;s=140" width="24" />
          <a href="/creationix">creationix</a>
        </li>
        <li class="facebox-user-list-item">
          <img height="24" src="https://1.gravatar.com/avatar/b1e65792c33ab7d44028dd0918e92d16?d=https%3A%2F%2Fidenticons.github.com%2Fab73535914798c3ad40ab8bea10188a4.png&amp;s=140" width="24" />
          <a href="/rfletcher">rfletcher</a>
        </li>
      </ul>
    </div>
  </div>

<div id="files" class="bubble">
  <div class="file">
    <div class="meta">
      <div class="info">
        <span class="icon"><b class="octicon octicon-file-text"></b></span>
        <span class="mode" title="File Mode">file</span>
          <span>6 lines (6 sloc)</span>
        <span>14.358 kb</span>
      </div>
      <div class="actions">
        <div class="button-group">
            <a class="minibutton tooltipped leftwards js-conduit-mac-openfile-check"
               href="http://mac.github.com"
               data-url="github-mac://openRepo/https://github.com/jashkenas/underscore?branch=master&amp;filepath=underscore-min.js"
               title="Open this file in GitHub for Mac">
                <span class="octicon octicon-device-desktop"></span> Open
            </a>
                <a class="minibutton tooltipped upwards"
                   title="Clicking this button will automatically fork this project so you can edit the file"
                   href="/jashkenas/underscore/edit/master/underscore-min.js"
                   data-method="post" rel="nofollow">Edit</a>
          <a href="/jashkenas/underscore/raw/master/underscore-min.js" class="button minibutton " id="raw-url">Raw</a>
            <a href="/jashkenas/underscore/blame/master/underscore-min.js" class="button minibutton ">Blame</a>
          <a href="/jashkenas/underscore/commits/master/underscore-min.js" class="button minibutton " rel="nofollow">History</a>
        </div><!-- /.button-group -->
            <a class="minibutton danger empty-icon tooltipped downwards"
               href="/jashkenas/underscore/delete/master/underscore-min.js"
               title="Fork this project and delete file"
               data-method="post" data-test-id="delete-blob-file" rel="nofollow">
            Delete
          </a>
      </div><!-- /.actions -->

    </div>
        <div class="blob-wrapper data type-javascript js-blob-data">
        <table class="file-code file-diff">
          <tr class="file-code-line">
            <td class="blob-line-nums">
              <span id="L1" rel="#L1">1</span>
<span id="L2" rel="#L2">2</span>
<span id="L3" rel="#L3">3</span>
<span id="L4" rel="#L4">4</span>
<span id="L5" rel="#L5">5</span>
<span id="L6" rel="#L6">6</span>

            </td>
            <td class="blob-line-code">
                    <div class="highlight"><pre><div class='line' id='LC1'><span class="c1">//     Underscore.js 1.5.2</span></div><div class='line' id='LC2'><span class="c1">//     http://underscorejs.org</span></div><div class='line' id='LC3'><span class="c1">//     (c) 2009-2013 Jeremy Ashkenas, DocumentCloud and Investigative Reporters &amp; Editors</span></div><div class='line' id='LC4'><span class="c1">//     Underscore may be freely distributed under the MIT license.</span></div><div class='line' id='LC5'><span class="p">(</span><span class="kd">function</span><span class="p">(){</span><span class="kd">var</span> <span class="nx">n</span><span class="o">=</span><span class="k">this</span><span class="p">,</span><span class="nx">t</span><span class="o">=</span><span class="nx">n</span><span class="p">.</span><span class="nx">_</span><span class="p">,</span><span class="nx">r</span><span class="o">=</span><span class="p">{},</span><span class="nx">e</span><span class="o">=</span><span class="nb">Array</span><span class="p">.</span><span class="nx">prototype</span><span class="p">,</span><span class="nx">u</span><span class="o">=</span><span class="nb">Object</span><span class="p">.</span><span class="nx">prototype</span><span class="p">,</span><span class="nx">i</span><span class="o">=</span><span class="nb">Function</span><span class="p">.</span><span class="nx">prototype</span><span class="p">,</span><span class="nx">a</span><span class="o">=</span><span class="nx">e</span><span class="p">.</span><span class="nx">push</span><span class="p">,</span><span class="nx">o</span><span class="o">=</span><span class="nx">e</span><span class="p">.</span><span class="nx">slice</span><span class="p">,</span><span class="nx">c</span><span class="o">=</span><span class="nx">e</span><span class="p">.</span><span class="nx">concat</span><span class="p">,</span><span class="nx">l</span><span class="o">=</span><span class="nx">u</span><span class="p">.</span><span class="nx">toString</span><span class="p">,</span><span class="nx">f</span><span class="o">=</span><span class="nx">u</span><span class="p">.</span><span class="nx">hasOwnProperty</span><span class="p">,</span><span class="nx">s</span><span class="o">=</span><span class="nx">e</span><span class="p">.</span><span class="nx">forEach</span><span class="p">,</span><span class="nx">p</span><span class="o">=</span><span class="nx">e</span><span class="p">.</span><span class="nx">map</span><span class="p">,</span><span class="nx">h</span><span class="o">=</span><span class="nx">e</span><span class="p">.</span><span class="nx">reduce</span><span class="p">,</span><span class="nx">v</span><span class="o">=</span><span class="nx">e</span><span class="p">.</span><span class="nx">reduceRight</span><span class="p">,</span><span class="nx">g</span><span class="o">=</span><span class="nx">e</span><span class="p">.</span><span class="nx">filter</span><span class="p">,</span><span class="nx">d</span><span class="o">=</span><span class="nx">e</span><span class="p">.</span><span class="nx">every</span><span class="p">,</span><span class="nx">m</span><span class="o">=</span><span class="nx">e</span><span class="p">.</span><span class="nx">some</span><span class="p">,</span><span class="nx">y</span><span class="o">=</span><span class="nx">e</span><span class="p">.</span><span class="nx">indexOf</span><span class="p">,</span><span class="nx">b</span><span class="o">=</span><span class="nx">e</span><span class="p">.</span><span class="nx">lastIndexOf</span><span class="p">,</span><span class="nx">x</span><span class="o">=</span><span class="nb">Array</span><span class="p">.</span><span class="nx">isArray</span><span class="p">,</span><span class="nx">w</span><span class="o">=</span><span class="nb">Object</span><span class="p">.</span><span class="nx">keys</span><span class="p">,</span><span class="nx">_</span><span class="o">=</span><span class="nx">i</span><span class="p">.</span><span class="nx">bind</span><span class="p">,</span><span class="nx">j</span><span class="o">=</span><span class="kd">function</span><span class="p">(</span><span class="nx">n</span><span class="p">){</span><span class="k">return</span> <span class="nx">n</span> <span class="k">instanceof</span> <span class="nx">j</span><span class="o">?</span><span class="nx">n</span><span class="o">:</span><span class="k">this</span> <span class="k">instanceof</span> <span class="nx">j</span><span class="o">?</span><span class="p">(</span><span class="k">this</span><span class="p">.</span><span class="nx">_wrapped</span><span class="o">=</span><span class="nx">n</span><span class="p">,</span><span class="k">void</span> <span class="mi">0</span><span class="p">)</span><span class="o">:</span><span class="k">new</span> <span class="nx">j</span><span class="p">(</span><span class="nx">n</span><span class="p">)};</span><span class="s2">&quot;undefined&quot;</span><span class="o">!=</span><span class="k">typeof</span> <span class="nx">exports</span><span class="o">?</span><span class="p">(</span><span class="s2">&quot;undefined&quot;</span><span class="o">!=</span><span class="k">typeof</span> <span class="nx">module</span><span class="o">&amp;&amp;</span><span class="nx">module</span><span class="p">.</span><span class="nx">exports</span><span class="o">&amp;&amp;</span><span class="p">(</span><span class="nx">exports</span><span class="o">=</span><span class="nx">module</span><span class="p">.</span><span class="nx">exports</span><span class="o">=</span><span class="nx">j</span><span class="p">),</span><span class="nx">exports</span><span class="p">.</span><span class="nx">_</span><span class="o">=</span><span class="nx">j</span><span class="p">)</span><span class="o">:</span><span class="nx">n</span><span class="p">.</span><span class="nx">_</span><span class="o">=</span><span class="nx">j</span><span class="p">,</span><span class="nx">j</span><span class="p">.</span><span class="nx">VERSION</span><span class="o">=</span><span class="s2">&quot;1.5.2&quot;</span><span class="p">;</span><span class="kd">var</span> <span class="nx">A</span><span class="o">=</span><span class="nx">j</span><span class="p">.</span><span class="nx">each</span><span class="o">=</span><span class="nx">j</span><span class="p">.</span><span class="nx">forEach</span><span class="o">=</span><span class="kd">function</span><span class="p">(</span><span class="nx">n</span><span class="p">,</span><span class="nx">t</span><span class="p">,</span><span class="nx">e</span><span class="p">){</span><span class="k">if</span><span class="p">(</span><span class="kc">null</span><span class="o">!=</span><span class="nx">n</span><span class="p">)</span><span class="k">if</span><span class="p">(</span><span class="nx">s</span><span class="o">&amp;&amp;</span><span class="nx">n</span><span class="p">.</span><span class="nx">forEach</span><span class="o">===</span><span class="nx">s</span><span class="p">)</span><span class="nx">n</span><span class="p">.</span><span class="nx">forEach</span><span class="p">(</span><span class="nx">t</span><span class="p">,</span><span class="nx">e</span><span class="p">);</span><span class="k">else</span> <span class="k">if</span><span class="p">(</span><span class="nx">n</span><span class="p">.</span><span class="nx">length</span><span class="o">===+</span><span class="nx">n</span><span class="p">.</span><span class="nx">length</span><span class="p">){</span><span class="k">for</span><span class="p">(</span><span class="kd">var</span> <span class="nx">u</span><span class="o">=</span><span class="mi">0</span><span class="p">,</span><span class="nx">i</span><span class="o">=</span><span class="nx">n</span><span class="p">.</span><span class="nx">length</span><span class="p">;</span><span class="nx">i</span><span class="o">&gt;</span><span class="nx">u</span><span class="p">;</span><span class="nx">u</span><span class="o">++</span><span class="p">)</span><span class="k">if</span><span class="p">(</span><span class="nx">t</span><span class="p">.</span><span class="nx">call</span><span class="p">(</span><span class="nx">e</span><span class="p">,</span><span class="nx">n</span><span class="p">[</span><span class="nx">u</span><span class="p">],</span><span class="nx">u</span><span class="p">,</span><span class="nx">n</span><span class="p">)</span><span class="o">===</span><span class="nx">r</span><span class="p">)</span><span class="k">return</span><span class="p">}</span><span class="k">else</span> <span class="k">for</span><span class="p">(</span><span class="kd">var</span> <span class="nx">a</span><span class="o">=</span><span class="nx">j</span><span class="p">.</span><span class="nx">keys</span><span class="p">(</span><span class="nx">n</span><span class="p">),</span><span class="nx">u</span><span class="o">=</span><span class="mi">0</span><span class="p">,</span><span class="nx">i</span><span class="o">=</span><span class="nx">a</span><span class="p">.</span><span class="nx">length</span><span class="p">;</span><span class="nx">i</span><span class="o">&gt;</span><span class="nx">u</span><span class="p">;</span><span class="nx">u</span><span class="o">++</span><span class="p">)</span><span class="k">if</span><span class="p">(</span><span class="nx">t</span><span class="p">.</span><span class="nx">call</span><span class="p">(</span><span class="nx">e</span><span class="p">,</span><span class="nx">n</span><span class="p">[</span><span class="nx">a</span><span class="p">[</span><span class="nx">u</span><span class="p">]],</span><span class="nx">a</span><span class="p">[</span><span class="nx">u</span><span class="p">],</span><span class="nx">n</span><span class="p">)</span><span class="o">===</span><span class="nx">r</span><span class="p">)</span><span class="k">return</span><span class="p">};</span><span class="nx">j</span><span class="p">.</span><span class="nx">map</span><span class="o">=</span><span class="nx">j</span><span class="p">.</span><span class="nx">collect</span><span class="o">=</span><span class="kd">function</span><span class="p">(</span><span class="nx">n</span><span class="p">,</span><span class="nx">t</span><span class="p">,</span><span class="nx">r</span><span class="p">){</span><span class="kd">var</span> <span class="nx">e</span><span class="o">=</span><span class="p">[];</span><span class="k">return</span> <span class="kc">null</span><span class="o">==</span><span class="nx">n</span><span class="o">?</span><span class="nx">e</span><span class="o">:</span><span class="nx">p</span><span class="o">&amp;&amp;</span><span class="nx">n</span><span class="p">.</span><span class="nx">map</span><span class="o">===</span><span class="nx">p</span><span class="o">?</span><span class="nx">n</span><span class="p">.</span><span class="nx">map</span><span class="p">(</span><span class="nx">t</span><span class="p">,</span><span class="nx">r</span><span class="p">)</span><span class="o">:</span><span class="p">(</span><span class="nx">A</span><span class="p">(</span><span class="nx">n</span><span class="p">,</span><span class="kd">function</span><span class="p">(</span><span class="nx">n</span><span class="p">,</span><span class="nx">u</span><span class="p">,</span><span class="nx">i</span><span class="p">){</span><span class="nx">e</span><span class="p">.</span><span class="nx">push</span><span class="p">(</span><span class="nx">t</span><span class="p">.</span><span class="nx">call</span><span class="p">(</span><span class="nx">r</span><span class="p">,</span><span class="nx">n</span><span class="p">,</span><span class="nx">u</span><span class="p">,</span><span class="nx">i</span><span class="p">))}),</span><span class="nx">e</span><span class="p">)};</span><span class="kd">var</span> <span class="nx">E</span><span class="o">=</span><span class="s2">&quot;Reduce of empty array with no initial value&quot;</span><span class="p">;</span><span class="nx">j</span><span class="p">.</span><span class="nx">reduce</span><span class="o">=</span><span class="nx">j</span><span class="p">.</span><span class="nx">foldl</span><span class="o">=</span><span class="nx">j</span><span class="p">.</span><span class="nx">inject</span><span class="o">=</span><span class="kd">function</span><span class="p">(</span><span class="nx">n</span><span class="p">,</span><span class="nx">t</span><span class="p">,</span><span class="nx">r</span><span class="p">,</span><span class="nx">e</span><span class="p">){</span><span class="kd">var</span> <span class="nx">u</span><span class="o">=</span><span class="nx">arguments</span><span class="p">.</span><span class="nx">length</span><span class="o">&gt;</span><span class="mi">2</span><span class="p">;</span><span class="k">if</span><span class="p">(</span><span class="kc">null</span><span class="o">==</span><span class="nx">n</span><span class="o">&amp;&amp;</span><span class="p">(</span><span class="nx">n</span><span class="o">=</span><span class="p">[]),</span><span class="nx">h</span><span class="o">&amp;&amp;</span><span class="nx">n</span><span class="p">.</span><span class="nx">reduce</span><span class="o">===</span><span class="nx">h</span><span class="p">)</span><span class="k">return</span> <span class="nx">e</span><span class="o">&amp;&amp;</span><span class="p">(</span><span class="nx">t</span><span class="o">=</span><span class="nx">j</span><span class="p">.</span><span class="nx">bind</span><span class="p">(</span><span class="nx">t</span><span class="p">,</span><span class="nx">e</span><span class="p">)),</span><span class="nx">u</span><span class="o">?</span><span class="nx">n</span><span class="p">.</span><span class="nx">reduce</span><span class="p">(</span><span class="nx">t</span><span class="p">,</span><span class="nx">r</span><span class="p">)</span><span class="o">:</span><span class="nx">n</span><span class="p">.</span><span class="nx">reduce</span><span class="p">(</span><span class="nx">t</span><span class="p">);</span><span class="k">if</span><span class="p">(</span><span class="nx">A</span><span class="p">(</span><span class="nx">n</span><span class="p">,</span><span class="kd">function</span><span class="p">(</span><span class="nx">n</span><span class="p">,</span><span class="nx">i</span><span class="p">,</span><span class="nx">a</span><span class="p">){</span><span class="nx">u</span><span class="o">?</span><span class="nx">r</span><span class="o">=</span><span class="nx">t</span><span class="p">.</span><span class="nx">call</span><span class="p">(</span><span class="nx">e</span><span class="p">,</span><span class="nx">r</span><span class="p">,</span><span class="nx">n</span><span class="p">,</span><span class="nx">i</span><span class="p">,</span><span class="nx">a</span><span class="p">)</span><span class="o">:</span><span class="p">(</span><span class="nx">r</span><span class="o">=</span><span class="nx">n</span><span class="p">,</span><span class="nx">u</span><span class="o">=!</span><span class="mi">0</span><span class="p">)}),</span><span class="o">!</span><span class="nx">u</span><span class="p">)</span><span class="k">throw</span> <span class="k">new</span> <span class="nx">TypeError</span><span class="p">(</span><span class="nx">E</span><span class="p">);</span><span class="k">return</span> <span class="nx">r</span><span class="p">},</span><span class="nx">j</span><span class="p">.</span><span class="nx">reduceRight</span><span class="o">=</span><span class="nx">j</span><span class="p">.</span><span class="nx">foldr</span><span class="o">=</span><span class="kd">function</span><span class="p">(</span><span class="nx">n</span><span class="p">,</span><span class="nx">t</span><span class="p">,</span><span class="nx">r</span><span class="p">,</span><span class="nx">e</span><span class="p">){</span><span class="kd">var</span> <span class="nx">u</span><span class="o">=</span><span class="nx">arguments</span><span class="p">.</span><span class="nx">length</span><span class="o">&gt;</span><span class="mi">2</span><span class="p">;</span><span class="k">if</span><span class="p">(</span><span class="kc">null</span><span class="o">==</span><span class="nx">n</span><span class="o">&amp;&amp;</span><span class="p">(</span><span class="nx">n</span><span class="o">=</span><span class="p">[]),</span><span class="nx">v</span><span class="o">&amp;&amp;</span><span class="nx">n</span><span class="p">.</span><span class="nx">reduceRight</span><span class="o">===</span><span class="nx">v</span><span class="p">)</span><span class="k">return</span> <span class="nx">e</span><span class="o">&amp;&amp;</span><span class="p">(</span><span class="nx">t</span><span class="o">=</span><span class="nx">j</span><span class="p">.</span><span class="nx">bind</span><span class="p">(</span><span class="nx">t</span><span class="p">,</span><span class="nx">e</span><span class="p">)),</span><span class="nx">u</span><span class="o">?</span><span class="nx">n</span><span class="p">.</span><span class="nx">reduceRight</span><span class="p">(</span><span class="nx">t</span><span class="p">,</span><span class="nx">r</span><span class="p">)</span><span class="o">:</span><span class="nx">n</span><span class="p">.</span><span class="nx">reduceRight</span><span class="p">(</span><span class="nx">t</span><span class="p">);</span><span class="kd">var</span> <span class="nx">i</span><span class="o">=</span><span class="nx">n</span><span class="p">.</span><span class="nx">length</span><span class="p">;</span><span class="k">if</span><span class="p">(</span><span class="nx">i</span><span class="o">!==+</span><span class="nx">i</span><span class="p">){</span><span class="kd">var</span> <span class="nx">a</span><span class="o">=</span><span class="nx">j</span><span class="p">.</span><span class="nx">keys</span><span class="p">(</span><span class="nx">n</span><span class="p">);</span><span class="nx">i</span><span class="o">=</span><span class="nx">a</span><span class="p">.</span><span class="nx">length</span><span class="p">}</span><span class="k">if</span><span class="p">(</span><span class="nx">A</span><span class="p">(</span><span class="nx">n</span><span class="p">,</span><span class="kd">function</span><span class="p">(</span><span class="nx">o</span><span class="p">,</span><span class="nx">c</span><span class="p">,</span><span class="nx">l</span><span class="p">){</span><span class="nx">c</span><span class="o">=</span><span class="nx">a</span><span class="o">?</span><span class="nx">a</span><span class="p">[</span><span class="o">--</span><span class="nx">i</span><span class="p">]</span><span class="o">:--</span><span class="nx">i</span><span class="p">,</span><span class="nx">u</span><span class="o">?</span><span class="nx">r</span><span class="o">=</span><span class="nx">t</span><span class="p">.</span><span class="nx">call</span><span class="p">(</span><span class="nx">e</span><span class="p">,</span><span class="nx">r</span><span class="p">,</span><span class="nx">n</span><span class="p">[</span><span class="nx">c</span><span class="p">],</span><span class="nx">c</span><span class="p">,</span><span class="nx">l</span><span class="p">)</span><span class="o">:</span><span class="p">(</span><span class="nx">r</span><span class="o">=</span><span class="nx">n</span><span class="p">[</span><span class="nx">c</span><span class="p">],</span><span class="nx">u</span><span class="o">=!</span><span class="mi">0</span><span class="p">)}),</span><span class="o">!</span><span class="nx">u</span><span class="p">)</span><span class="k">throw</span> <span class="k">new</span> <span class="nx">TypeError</span><span class="p">(</span><span class="nx">E</span><span class="p">);</span><span class="k">return</span> <span class="nx">r</span><span class="p">},</span><span class="nx">j</span><span class="p">.</span><span class="nx">find</span><span class="o">=</span><span class="nx">j</span><span class="p">.</span><span class="nx">detect</span><span class="o">=</span><span class="kd">function</span><span class="p">(</span><span class="nx">n</span><span class="p">,</span><span class="nx">t</span><span class="p">,</span><span class="nx">r</span><span class="p">){</span><span class="kd">var</span> <span class="nx">e</span><span class="p">;</span><span class="k">return</span> <span class="nx">O</span><span class="p">(</span><span class="nx">n</span><span class="p">,</span><span class="kd">function</span><span class="p">(</span><span class="nx">n</span><span class="p">,</span><span class="nx">u</span><span class="p">,</span><span class="nx">i</span><span class="p">){</span><span class="k">return</span> <span class="nx">t</span><span class="p">.</span><span class="nx">call</span><span class="p">(</span><span class="nx">r</span><span class="p">,</span><span class="nx">n</span><span class="p">,</span><span class="nx">u</span><span class="p">,</span><span class="nx">i</span><span class="p">)</span><span class="o">?</span><span class="p">(</span><span class="nx">e</span><span class="o">=</span><span class="nx">n</span><span class="p">,</span><span class="o">!</span><span class="mi">0</span><span class="p">)</span><span class="o">:</span><span class="k">void</span> <span class="mi">0</span><span class="p">}),</span><span class="nx">e</span><span class="p">},</span><span class="nx">j</span><span class="p">.</span><span class="nx">filter</span><span class="o">=</span><span class="nx">j</span><span class="p">.</span><span class="nx">select</span><span class="o">=</span><span class="kd">function</span><span class="p">(</span><span class="nx">n</span><span class="p">,</span><span class="nx">t</span><span class="p">,</span><span class="nx">r</span><span class="p">){</span><span class="kd">var</span> <span class="nx">e</span><span class="o">=</span><span class="p">[];</span><span class="k">return</span> <span class="kc">null</span><span class="o">==</span><span class="nx">n</span><span class="o">?</span><span class="nx">e</span><span class="o">:</span><span class="nx">g</span><span class="o">&amp;&amp;</span><span class="nx">n</span><span class="p">.</span><span class="nx">filter</span><span class="o">===</span><span class="nx">g</span><span class="o">?</span><span class="nx">n</span><span class="p">.</span><span class="nx">filter</span><span class="p">(</span><span class="nx">t</span><span class="p">,</span><span class="nx">r</span><span class="p">)</span><span class="o">:</span><span class="p">(</span><span class="nx">A</span><span class="p">(</span><span class="nx">n</span><span class="p">,</span><span class="kd">function</span><span class="p">(</span><span class="nx">n</span><span class="p">,</span><span class="nx">u</span><span class="p">,</span><span class="nx">i</span><span class="p">){</span><span class="nx">t</span><span class="p">.</span><span class="nx">call</span><span class="p">(</span><span class="nx">r</span><span class="p">,</span><span class="nx">n</span><span class="p">,</span><span class="nx">u</span><span class="p">,</span><span class="nx">i</span><span class="p">)</span><span class="o">&amp;&amp;</span><span class="nx">e</span><span class="p">.</span><span class="nx">push</span><span class="p">(</span><span class="nx">n</span><span class="p">)}),</span><span class="nx">e</span><span class="p">)},</span><span class="nx">j</span><span class="p">.</span><span class="nx">reject</span><span class="o">=</span><span class="kd">function</span><span class="p">(</span><span class="nx">n</span><span class="p">,</span><span class="nx">t</span><span class="p">,</span><span class="nx">r</span><span class="p">){</span><span class="k">return</span> <span class="nx">j</span><span class="p">.</span><span class="nx">filter</span><span class="p">(</span><span class="nx">n</span><span class="p">,</span><span class="kd">function</span><span class="p">(</span><span class="nx">n</span><span class="p">,</span><span class="nx">e</span><span class="p">,</span><span class="nx">u</span><span class="p">){</span><span class="k">return</span><span class="o">!</span><span class="nx">t</span><span class="p">.</span><span class="nx">call</span><span class="p">(</span><span class="nx">r</span><span class="p">,</span><span class="nx">n</span><span class="p">,</span><span class="nx">e</span><span class="p">,</span><span class="nx">u</span><span class="p">)},</span><span class="nx">r</span><span class="p">)},</span><span class="nx">j</span><span class="p">.</span><span class="nx">every</span><span class="o">=</span><span class="nx">j</span><span class="p">.</span><span class="nx">all</span><span class="o">=</span><span class="kd">function</span><span class="p">(</span><span class="nx">n</span><span class="p">,</span><span class="nx">t</span><span class="p">,</span><span class="nx">e</span><span class="p">){</span><span class="nx">t</span><span class="o">||</span><span class="p">(</span><span class="nx">t</span><span class="o">=</span><span class="nx">j</span><span class="p">.</span><span class="nx">identity</span><span class="p">);</span><span class="kd">var</span> <span class="nx">u</span><span class="o">=!</span><span class="mi">0</span><span class="p">;</span><span class="k">return</span> <span class="kc">null</span><span class="o">==</span><span class="nx">n</span><span class="o">?</span><span class="nx">u</span><span class="o">:</span><span class="nx">d</span><span class="o">&amp;&amp;</span><span class="nx">n</span><span class="p">.</span><span class="nx">every</span><span class="o">===</span><span class="nx">d</span><span class="o">?</span><span class="nx">n</span><span class="p">.</span><span class="nx">every</span><span class="p">(</span><span class="nx">t</span><span class="p">,</span><span class="nx">e</span><span class="p">)</span><span class="o">:</span><span class="p">(</span><span class="nx">A</span><span class="p">(</span><span class="nx">n</span><span class="p">,</span><span class="kd">function</span><span class="p">(</span><span class="nx">n</span><span class="p">,</span><span class="nx">i</span><span class="p">,</span><span class="nx">a</span><span class="p">){</span><span class="k">return</span><span class="p">(</span><span class="nx">u</span><span class="o">=</span><span class="nx">u</span><span class="o">&amp;&amp;</span><span class="nx">t</span><span class="p">.</span><span class="nx">call</span><span class="p">(</span><span class="nx">e</span><span class="p">,</span><span class="nx">n</span><span class="p">,</span><span class="nx">i</span><span class="p">,</span><span class="nx">a</span><span class="p">))</span><span class="o">?</span><span class="k">void</span> <span class="mi">0</span><span class="o">:</span><span class="nx">r</span><span class="p">}),</span><span class="o">!!</span><span class="nx">u</span><span class="p">)};</span><span class="kd">var</span> <span class="nx">O</span><span class="o">=</span><span class="nx">j</span><span class="p">.</span><span class="nx">some</span><span class="o">=</span><span class="nx">j</span><span class="p">.</span><span class="nx">any</span><span class="o">=</span><span class="kd">function</span><span class="p">(</span><span class="nx">n</span><span class="p">,</span><span class="nx">t</span><span class="p">,</span><span class="nx">e</span><span class="p">){</span><span class="nx">t</span><span class="o">||</span><span class="p">(</span><span class="nx">t</span><span class="o">=</span><span class="nx">j</span><span class="p">.</span><span class="nx">identity</span><span class="p">);</span><span class="kd">var</span> <span class="nx">u</span><span class="o">=!</span><span class="mi">1</span><span class="p">;</span><span class="k">return</span> <span class="kc">null</span><span class="o">==</span><span class="nx">n</span><span class="o">?</span><span class="nx">u</span><span class="o">:</span><span class="nx">m</span><span class="o">&amp;&amp;</span><span class="nx">n</span><span class="p">.</span><span class="nx">some</span><span class="o">===</span><span class="nx">m</span><span class="o">?</span><span class="nx">n</span><span class="p">.</span><span class="nx">some</span><span class="p">(</span><span class="nx">t</span><span class="p">,</span><span class="nx">e</span><span class="p">)</span><span class="o">:</span><span class="p">(</span><span class="nx">A</span><span class="p">(</span><span class="nx">n</span><span class="p">,</span><span class="kd">function</span><span class="p">(</span><span class="nx">n</span><span class="p">,</span><span class="nx">i</span><span class="p">,</span><span class="nx">a</span><span class="p">){</span><span class="k">return</span> <span class="nx">u</span><span class="o">||</span><span class="p">(</span><span class="nx">u</span><span class="o">=</span><span class="nx">t</span><span class="p">.</span><span class="nx">call</span><span class="p">(</span><span class="nx">e</span><span class="p">,</span><span class="nx">n</span><span class="p">,</span><span class="nx">i</span><span class="p">,</span><span class="nx">a</span><span class="p">))</span><span class="o">?</span><span class="nx">r</span><span class="o">:</span><span class="k">void</span> <span class="mi">0</span><span class="p">}),</span><span class="o">!!</span><span class="nx">u</span><span class="p">)};</span><span class="nx">j</span><span class="p">.</span><span class="nx">contains</span><span class="o">=</span><span class="nx">j</span><span class="p">.</span><span class="nx">include</span><span class="o">=</span><span class="kd">function</span><span class="p">(</span><span class="nx">n</span><span class="p">,</span><span class="nx">t</span><span class="p">){</span><span class="k">return</span> <span class="kc">null</span><span class="o">==</span><span class="nx">n</span><span class="o">?!</span><span class="mi">1</span><span class="o">:</span><span class="nx">y</span><span class="o">&amp;&amp;</span><span class="nx">n</span><span class="p">.</span><span class="nx">indexOf</span><span class="o">===</span><span class="nx">y</span><span class="o">?</span><span class="nx">n</span><span class="p">.</span><span class="nx">indexOf</span><span class="p">(</span><span class="nx">t</span><span class="p">)</span><span class="o">!=-</span><span class="mi">1</span><span class="o">:</span><span class="nx">O</span><span class="p">(</span><span class="nx">n</span><span class="p">,</span><span class="kd">function</span><span class="p">(</span><span class="nx">n</span><span class="p">){</span><span class="k">return</span> <span class="nx">n</span><span class="o">===</span><span class="nx">t</span><span class="p">})},</span><span class="nx">j</span><span class="p">.</span><span class="nx">invoke</span><span class="o">=</span><span class="kd">function</span><span class="p">(</span><span class="nx">n</span><span class="p">,</span><span class="nx">t</span><span class="p">){</span><span class="kd">var</span> <span class="nx">r</span><span class="o">=</span><span class="nx">o</span><span class="p">.</span><span class="nx">call</span><span class="p">(</span><span class="nx">arguments</span><span class="p">,</span><span class="mi">2</span><span class="p">),</span><span class="nx">e</span><span class="o">=</span><span class="nx">j</span><span class="p">.</span><span class="nx">isFunction</span><span class="p">(</span><span class="nx">t</span><span class="p">);</span><span class="k">return</span> <span class="nx">j</span><span class="p">.</span><span class="nx">map</span><span class="p">(</span><span class="nx">n</span><span class="p">,</span><span class="kd">function</span><span class="p">(</span><span class="nx">n</span><span class="p">){</span><span class="k">return</span><span class="p">(</span><span class="nx">e</span><span class="o">?</span><span class="nx">t</span><span class="o">:</span><span class="nx">n</span><span class="p">[</span><span class="nx">t</span><span class="p">]).</span><span class="nx">apply</span><span class="p">(</span><span class="nx">n</span><span class="p">,</span><span class="nx">r</span><span class="p">)})},</span><span class="nx">j</span><span class="p">.</span><span class="nx">pluck</span><span class="o">=</span><span class="kd">function</span><span class="p">(</span><span class="nx">n</span><span class="p">,</span><span class="nx">t</span><span class="p">){</span><span class="k">return</span> <span class="nx">j</span><span class="p">.</span><span class="nx">map</span><span class="p">(</span><span class="nx">n</span><span class="p">,</span><span class="kd">function</span><span class="p">(</span><span class="nx">n</span><span class="p">){</span><span class="k">return</span> <span class="nx">n</span><span class="p">[</span><span class="nx">t</span><span class="p">]})},</span><span class="nx">j</span><span class="p">.</span><span class="nx">where</span><span class="o">=</span><span class="kd">function</span><span class="p">(</span><span class="nx">n</span><span class="p">,</span><span class="nx">t</span><span class="p">,</span><span class="nx">r</span><span class="p">){</span><span class="k">return</span> <span class="nx">j</span><span class="p">.</span><span class="nx">isEmpty</span><span class="p">(</span><span class="nx">t</span><span class="p">)</span><span class="o">?</span><span class="nx">r</span><span class="o">?</span><span class="k">void</span> <span class="mi">0</span><span class="o">:</span><span class="p">[]</span><span class="o">:</span><span class="nx">j</span><span class="p">[</span><span class="nx">r</span><span class="o">?</span><span class="s2">&quot;find&quot;</span><span class="o">:</span><span class="s2">&quot;filter&quot;</span><span class="p">](</span><span class="nx">n</span><span class="p">,</span><span class="kd">function</span><span class="p">(</span><span class="nx">n</span><span class="p">){</span><span class="k">for</span><span class="p">(</span><span class="kd">var</span> <span class="nx">r</span> <span class="k">in</span> <span class="nx">t</span><span class="p">)</span><span class="k">if</span><span class="p">(</span><span class="nx">t</span><span class="p">[</span><span class="nx">r</span><span class="p">]</span><span class="o">!==</span><span class="nx">n</span><span class="p">[</span><span class="nx">r</span><span class="p">])</span><span class="k">return</span><span class="o">!</span><span class="mi">1</span><span class="p">;</span><span class="k">return</span><span class="o">!</span><span class="mi">0</span><span class="p">})},</span><span class="nx">j</span><span class="p">.</span><span class="nx">findWhere</span><span class="o">=</span><span class="kd">function</span><span class="p">(</span><span class="nx">n</span><span class="p">,</span><span class="nx">t</span><span class="p">){</span><span class="k">return</span> <span class="nx">j</span><span class="p">.</span><span class="nx">where</span><span class="p">(</span><span class="nx">n</span><span class="p">,</span><span class="nx">t</span><span class="p">,</span><span class="o">!</span><span class="mi">0</span><span class="p">)},</span><span class="nx">j</span><span class="p">.</span><span class="nx">max</span><span class="o">=</span><span class="kd">function</span><span class="p">(</span><span class="nx">n</span><span class="p">,</span><span class="nx">t</span><span class="p">,</span><span class="nx">r</span><span class="p">){</span><span class="k">if</span><span class="p">(</span><span class="o">!</span><span class="nx">t</span><span class="o">&amp;&amp;</span><span class="nx">j</span><span class="p">.</span><span class="nx">isArray</span><span class="p">(</span><span class="nx">n</span><span class="p">)</span><span class="o">&amp;&amp;</span><span class="nx">n</span><span class="p">[</span><span class="mi">0</span><span class="p">]</span><span class="o">===+</span><span class="nx">n</span><span class="p">[</span><span class="mi">0</span><span class="p">]</span><span class="o">&amp;&amp;</span><span class="nx">n</span><span class="p">.</span><span class="nx">length</span><span class="o">&lt;</span><span class="mi">65535</span><span class="p">)</span><span class="k">return</span> <span class="nb">Math</span><span class="p">.</span><span class="nx">max</span><span class="p">.</span><span class="nx">apply</span><span class="p">(</span><span class="nb">Math</span><span class="p">,</span><span class="nx">n</span><span class="p">);</span><span class="k">if</span><span class="p">(</span><span class="o">!</span><span class="nx">t</span><span class="o">&amp;&amp;</span><span class="nx">j</span><span class="p">.</span><span class="nx">isEmpty</span><span class="p">(</span><span class="nx">n</span><span class="p">))</span><span class="k">return</span><span class="o">-</span><span class="mi">1</span><span class="o">/</span><span class="mi">0</span><span class="p">;</span><span class="kd">var</span> <span class="nx">e</span><span class="o">=</span><span class="p">{</span><span class="nx">computed</span><span class="o">:-</span><span class="mi">1</span><span class="o">/</span><span class="mi">0</span><span class="p">,</span><span class="nx">value</span><span class="o">:-</span><span class="mi">1</span><span class="o">/</span><span class="mi">0</span><span class="p">};</span><span class="k">return</span> <span class="nx">A</span><span class="p">(</span><span class="nx">n</span><span class="p">,</span><span class="kd">function</span><span class="p">(</span><span class="nx">n</span><span class="p">,</span><span class="nx">u</span><span class="p">,</span><span class="nx">i</span><span class="p">){</span><span class="kd">var</span> <span class="nx">a</span><span class="o">=</span><span class="nx">t</span><span class="o">?</span><span class="nx">t</span><span class="p">.</span><span class="nx">call</span><span class="p">(</span><span class="nx">r</span><span class="p">,</span><span class="nx">n</span><span class="p">,</span><span class="nx">u</span><span class="p">,</span><span class="nx">i</span><span class="p">)</span><span class="o">:</span><span class="nx">n</span><span class="p">;</span><span class="nx">a</span><span class="o">&gt;</span><span class="nx">e</span><span class="p">.</span><span class="nx">computed</span><span class="o">&amp;&amp;</span><span class="p">(</span><span class="nx">e</span><span class="o">=</span><span class="p">{</span><span class="nx">value</span><span class="o">:</span><span class="nx">n</span><span class="p">,</span><span class="nx">computed</span><span class="o">:</span><span class="nx">a</span><span class="p">})}),</span><span class="nx">e</span><span class="p">.</span><span class="nx">value</span><span class="p">},</span><span class="nx">j</span><span class="p">.</span><span class="nx">min</span><span class="o">=</span><span class="kd">function</span><span class="p">(</span><span class="nx">n</span><span class="p">,</span><span class="nx">t</span><span class="p">,</span><span class="nx">r</span><span class="p">){</span><span class="k">if</span><span class="p">(</span><span class="o">!</span><span class="nx">t</span><span class="o">&amp;&amp;</span><span class="nx">j</span><span class="p">.</span><span class="nx">isArray</span><span class="p">(</span><span class="nx">n</span><span class="p">)</span><span class="o">&amp;&amp;</span><span class="nx">n</span><span class="p">[</span><span class="mi">0</span><span class="p">]</span><span class="o">===+</span><span class="nx">n</span><span class="p">[</span><span class="mi">0</span><span class="p">]</span><span class="o">&amp;&amp;</span><span class="nx">n</span><span class="p">.</span><span class="nx">length</span><span class="o">&lt;</span><span class="mi">65535</span><span class="p">)</span><span class="k">return</span> <span class="nb">Math</span><span class="p">.</span><span class="nx">min</span><span class="p">.</span><span class="nx">apply</span><span class="p">(</span><span class="nb">Math</span><span class="p">,</span><span class="nx">n</span><span class="p">);</span><span class="k">if</span><span class="p">(</span><span class="o">!</span><span class="nx">t</span><span class="o">&amp;&amp;</span><span class="nx">j</span><span class="p">.</span><span class="nx">isEmpty</span><span class="p">(</span><span class="nx">n</span><span class="p">))</span><span class="k">return</span> <span class="mi">1</span><span class="o">/</span><span class="mi">0</span><span class="p">;</span><span class="kd">var</span> <span class="nx">e</span><span class="o">=</span><span class="p">{</span><span class="nx">computed</span><span class="o">:</span><span class="mi">1</span><span class="o">/</span><span class="mi">0</span><span class="p">,</span><span class="nx">value</span><span class="o">:</span><span class="mi">1</span><span class="o">/</span><span class="mi">0</span><span class="p">};</span><span class="k">return</span> <span class="nx">A</span><span class="p">(</span><span class="nx">n</span><span class="p">,</span><span class="kd">function</span><span class="p">(</span><span class="nx">n</span><span class="p">,</span><span class="nx">u</span><span class="p">,</span><span class="nx">i</span><span class="p">){</span><span class="kd">var</span> <span class="nx">a</span><span class="o">=</span><span class="nx">t</span><span class="o">?</span><span class="nx">t</span><span class="p">.</span><span class="nx">call</span><span class="p">(</span><span class="nx">r</span><span class="p">,</span><span class="nx">n</span><span class="p">,</span><span class="nx">u</span><span class="p">,</span><span class="nx">i</span><span class="p">)</span><span class="o">:</span><span class="nx">n</span><span class="p">;</span><span class="nx">a</span><span class="o">&lt;</span><span class="nx">e</span><span class="p">.</span><span class="nx">computed</span><span class="o">&amp;&amp;</span><span class="p">(</span><span class="nx">e</span><span class="o">=</span><span class="p">{</span><span class="nx">value</span><span class="o">:</span><span class="nx">n</span><span class="p">,</span><span class="nx">computed</span><span class="o">:</span><span class="nx">a</span><span class="p">})}),</span><span class="nx">e</span><span class="p">.</span><span class="nx">value</span><span class="p">},</span><span class="nx">j</span><span class="p">.</span><span class="nx">shuffle</span><span class="o">=</span><span class="kd">function</span><span class="p">(</span><span class="nx">n</span><span class="p">){</span><span class="kd">var</span> <span class="nx">t</span><span class="p">,</span><span class="nx">r</span><span class="o">=</span><span class="mi">0</span><span class="p">,</span><span class="nx">e</span><span class="o">=</span><span class="p">[];</span><span class="k">return</span> <span class="nx">A</span><span class="p">(</span><span class="nx">n</span><span class="p">,</span><span class="kd">function</span><span class="p">(</span><span class="nx">n</span><span class="p">){</span><span class="nx">t</span><span class="o">=</span><span class="nx">j</span><span class="p">.</span><span class="nx">random</span><span class="p">(</span><span class="nx">r</span><span class="o">++</span><span class="p">),</span><span class="nx">e</span><span class="p">[</span><span class="nx">r</span><span class="o">-</span><span class="mi">1</span><span class="p">]</span><span class="o">=</span><span class="nx">e</span><span class="p">[</span><span class="nx">t</span><span class="p">],</span><span class="nx">e</span><span class="p">[</span><span class="nx">t</span><span class="p">]</span><span class="o">=</span><span class="nx">n</span><span class="p">}),</span><span class="nx">e</span><span class="p">},</span><span class="nx">j</span><span class="p">.</span><span class="nx">sample</span><span class="o">=</span><span class="kd">function</span><span class="p">(</span><span class="nx">n</span><span class="p">,</span><span class="nx">t</span><span class="p">,</span><span class="nx">r</span><span class="p">){</span><span class="k">return</span> <span class="nx">arguments</span><span class="p">.</span><span class="nx">length</span><span class="o">&lt;</span><span class="mi">2</span><span class="o">||</span><span class="nx">r</span><span class="o">?</span><span class="nx">n</span><span class="p">[</span><span class="nx">j</span><span class="p">.</span><span class="nx">random</span><span class="p">(</span><span class="nx">n</span><span class="p">.</span><span class="nx">length</span><span class="o">-</span><span class="mi">1</span><span class="p">)]</span><span class="o">:</span><span class="nx">j</span><span class="p">.</span><span class="nx">shuffle</span><span class="p">(</span><span class="nx">n</span><span class="p">).</span><span class="nx">slice</span><span class="p">(</span><span class="mi">0</span><span class="p">,</span><span class="nb">Math</span><span class="p">.</span><span class="nx">max</span><span class="p">(</span><span class="mi">0</span><span class="p">,</span><span class="nx">t</span><span class="p">))};</span><span class="kd">var</span> <span class="nx">k</span><span class="o">=</span><span class="kd">function</span><span class="p">(</span><span class="nx">n</span><span class="p">){</span><span class="k">return</span> <span class="nx">j</span><span class="p">.</span><span class="nx">isFunction</span><span class="p">(</span><span class="nx">n</span><span class="p">)</span><span class="o">?</span><span class="nx">n</span><span class="o">:</span><span class="kd">function</span><span class="p">(</span><span class="nx">t</span><span class="p">){</span><span class="k">return</span> <span class="nx">t</span><span class="p">[</span><span class="nx">n</span><span class="p">]}};</span><span class="nx">j</span><span class="p">.</span><span class="nx">sortBy</span><span class="o">=</span><span class="kd">function</span><span class="p">(</span><span class="nx">n</span><span class="p">,</span><span class="nx">t</span><span class="p">,</span><span class="nx">r</span><span class="p">){</span><span class="kd">var</span> <span class="nx">e</span><span class="o">=</span><span class="nx">k</span><span class="p">(</span><span class="nx">t</span><span class="p">);</span><span class="k">return</span> <span class="nx">j</span><span class="p">.</span><span class="nx">pluck</span><span class="p">(</span><span class="nx">j</span><span class="p">.</span><span class="nx">map</span><span class="p">(</span><span class="nx">n</span><span class="p">,</span><span class="kd">function</span><span class="p">(</span><span class="nx">n</span><span class="p">,</span><span class="nx">t</span><span class="p">,</span><span class="nx">u</span><span class="p">){</span><span class="k">return</span><span class="p">{</span><span class="nx">value</span><span class="o">:</span><span class="nx">n</span><span class="p">,</span><span class="nx">index</span><span class="o">:</span><span class="nx">t</span><span class="p">,</span><span class="nx">criteria</span><span class="o">:</span><span class="nx">e</span><span class="p">.</span><span class="nx">call</span><span class="p">(</span><span class="nx">r</span><span class="p">,</span><span class="nx">n</span><span class="p">,</span><span class="nx">t</span><span class="p">,</span><span class="nx">u</span><span class="p">)}}).</span><span class="nx">sort</span><span class="p">(</span><span class="kd">function</span><span class="p">(</span><span class="nx">n</span><span class="p">,</span><span class="nx">t</span><span class="p">){</span><span class="kd">var</span> <span class="nx">r</span><span class="o">=</span><span class="nx">n</span><span class="p">.</span><span class="nx">criteria</span><span class="p">,</span><span class="nx">e</span><span class="o">=</span><span class="nx">t</span><span class="p">.</span><span class="nx">criteria</span><span class="p">;</span><span class="k">if</span><span class="p">(</span><span class="nx">r</span><span class="o">!==</span><span class="nx">e</span><span class="p">){</span><span class="k">if</span><span class="p">(</span><span class="nx">r</span><span class="o">&gt;</span><span class="nx">e</span><span class="o">||</span><span class="nx">r</span><span class="o">===</span><span class="k">void</span> <span class="mi">0</span><span class="p">)</span><span class="k">return</span> <span class="mi">1</span><span class="p">;</span><span class="k">if</span><span class="p">(</span><span class="nx">e</span><span class="o">&gt;</span><span class="nx">r</span><span class="o">||</span><span class="nx">e</span><span class="o">===</span><span class="k">void</span> <span class="mi">0</span><span class="p">)</span><span class="k">return</span><span class="o">-</span><span class="mi">1</span><span class="p">}</span><span class="k">return</span> <span class="nx">n</span><span class="p">.</span><span class="nx">index</span><span class="o">-</span><span class="nx">t</span><span class="p">.</span><span class="nx">index</span><span class="p">}),</span><span class="s2">&quot;value&quot;</span><span class="p">)};</span><span class="kd">var</span> <span class="nx">F</span><span class="o">=</span><span class="kd">function</span><span class="p">(</span><span class="nx">n</span><span class="p">){</span><span class="k">return</span> <span class="kd">function</span><span class="p">(</span><span class="nx">t</span><span class="p">,</span><span class="nx">r</span><span class="p">,</span><span class="nx">e</span><span class="p">){</span><span class="kd">var</span> <span class="nx">u</span><span class="o">=</span><span class="p">{},</span><span class="nx">i</span><span class="o">=</span><span class="kc">null</span><span class="o">==</span><span class="nx">r</span><span class="o">?</span><span class="nx">j</span><span class="p">.</span><span class="nx">identity</span><span class="o">:</span><span class="nx">k</span><span class="p">(</span><span class="nx">r</span><span class="p">);</span><span class="k">return</span> <span class="nx">A</span><span class="p">(</span><span class="nx">t</span><span class="p">,</span><span class="kd">function</span><span class="p">(</span><span class="nx">r</span><span class="p">,</span><span class="nx">a</span><span class="p">){</span><span class="kd">var</span> <span class="nx">o</span><span class="o">=</span><span class="nx">i</span><span class="p">.</span><span class="nx">call</span><span class="p">(</span><span class="nx">e</span><span class="p">,</span><span class="nx">r</span><span class="p">,</span><span class="nx">a</span><span class="p">,</span><span class="nx">t</span><span class="p">);</span><span class="nx">n</span><span class="p">(</span><span class="nx">u</span><span class="p">,</span><span class="nx">o</span><span class="p">,</span><span class="nx">r</span><span class="p">)}),</span><span class="nx">u</span><span class="p">}};</span><span class="nx">j</span><span class="p">.</span><span class="nx">groupBy</span><span class="o">=</span><span class="nx">F</span><span class="p">(</span><span class="kd">function</span><span class="p">(</span><span class="nx">n</span><span class="p">,</span><span class="nx">t</span><span class="p">,</span><span class="nx">r</span><span class="p">){(</span><span class="nx">j</span><span class="p">.</span><span class="nx">has</span><span class="p">(</span><span class="nx">n</span><span class="p">,</span><span class="nx">t</span><span class="p">)</span><span class="o">?</span><span class="nx">n</span><span class="p">[</span><span class="nx">t</span><span class="p">]</span><span class="o">:</span><span class="nx">n</span><span class="p">[</span><span class="nx">t</span><span class="p">]</span><span class="o">=</span><span class="p">[]).</span><span class="nx">push</span><span class="p">(</span><span class="nx">r</span><span class="p">)}),</span><span class="nx">j</span><span class="p">.</span><span class="nx">indexBy</span><span class="o">=</span><span class="nx">F</span><span class="p">(</span><span class="kd">function</span><span class="p">(</span><span class="nx">n</span><span class="p">,</span><span class="nx">t</span><span class="p">,</span><span class="nx">r</span><span class="p">){</span><span class="nx">n</span><span class="p">[</span><span class="nx">t</span><span class="p">]</span><span class="o">=</span><span class="nx">r</span><span class="p">}),</span><span class="nx">j</span><span class="p">.</span><span class="nx">countBy</span><span class="o">=</span><span class="nx">F</span><span class="p">(</span><span class="kd">function</span><span class="p">(</span><span class="nx">n</span><span class="p">,</span><span class="nx">t</span><span class="p">){</span><span class="nx">j</span><span class="p">.</span><span class="nx">has</span><span class="p">(</span><span class="nx">n</span><span class="p">,</span><span class="nx">t</span><span class="p">)</span><span class="o">?</span><span class="nx">n</span><span class="p">[</span><span class="nx">t</span><span class="p">]</span><span class="o">++:</span><span class="nx">n</span><span class="p">[</span><span class="nx">t</span><span class="p">]</span><span class="o">=</span><span class="mi">1</span><span class="p">}),</span><span class="nx">j</span><span class="p">.</span><span class="nx">sortedIndex</span><span class="o">=</span><span class="kd">function</span><span class="p">(</span><span class="nx">n</span><span class="p">,</span><span class="nx">t</span><span class="p">,</span><span class="nx">r</span><span class="p">,</span><span class="nx">e</span><span class="p">){</span><span class="nx">r</span><span class="o">=</span><span class="kc">null</span><span class="o">==</span><span class="nx">r</span><span class="o">?</span><span class="nx">j</span><span class="p">.</span><span class="nx">identity</span><span class="o">:</span><span class="nx">k</span><span class="p">(</span><span class="nx">r</span><span class="p">);</span><span class="k">for</span><span class="p">(</span><span class="kd">var</span> <span class="nx">u</span><span class="o">=</span><span class="nx">r</span><span class="p">.</span><span class="nx">call</span><span class="p">(</span><span class="nx">e</span><span class="p">,</span><span class="nx">t</span><span class="p">),</span><span class="nx">i</span><span class="o">=</span><span class="mi">0</span><span class="p">,</span><span class="nx">a</span><span class="o">=</span><span class="nx">n</span><span class="p">.</span><span class="nx">length</span><span class="p">;</span><span class="nx">a</span><span class="o">&gt;</span><span class="nx">i</span><span class="p">;){</span><span class="kd">var</span> <span class="nx">o</span><span class="o">=</span><span class="nx">i</span><span class="o">+</span><span class="nx">a</span><span class="o">&gt;&gt;&gt;</span><span class="mi">1</span><span class="p">;</span><span class="nx">r</span><span class="p">.</span><span class="nx">call</span><span class="p">(</span><span class="nx">e</span><span class="p">,</span><span class="nx">n</span><span class="p">[</span><span class="nx">o</span><span class="p">])</span><span class="o">&lt;</span><span class="nx">u</span><span class="o">?</span><span class="nx">i</span><span class="o">=</span><span class="nx">o</span><span class="o">+</span><span class="mi">1</span><span class="o">:</span><span class="nx">a</span><span class="o">=</span><span class="nx">o</span><span class="p">}</span><span class="k">return</span> <span class="nx">i</span><span class="p">},</span><span class="nx">j</span><span class="p">.</span><span class="nx">toArray</span><span class="o">=</span><span class="kd">function</span><span class="p">(</span><span class="nx">n</span><span class="p">){</span><span class="k">return</span> <span class="nx">n</span><span class="o">?</span><span class="nx">j</span><span class="p">.</span><span class="nx">isArray</span><span class="p">(</span><span class="nx">n</span><span class="p">)</span><span class="o">?</span><span class="nx">o</span><span class="p">.</span><span class="nx">call</span><span class="p">(</span><span class="nx">n</span><span class="p">)</span><span class="o">:</span><span class="nx">n</span><span class="p">.</span><span class="nx">length</span><span class="o">===+</span><span class="nx">n</span><span class="p">.</span><span class="nx">length</span><span class="o">?</span><span class="nx">j</span><span class="p">.</span><span class="nx">map</span><span class="p">(</span><span class="nx">n</span><span class="p">,</span><span class="nx">j</span><span class="p">.</span><span class="nx">identity</span><span class="p">)</span><span class="o">:</span><span class="nx">j</span><span class="p">.</span><span class="nx">values</span><span class="p">(</span><span class="nx">n</span><span class="p">)</span><span class="o">:</span><span class="p">[]},</span><span class="nx">j</span><span class="p">.</span><span class="nx">size</span><span class="o">=</span><span class="kd">function</span><span class="p">(</span><span class="nx">n</span><span class="p">){</span><span class="k">return</span> <span class="kc">null</span><span class="o">==</span><span class="nx">n</span><span class="o">?</span><span class="mi">0</span><span class="o">:</span><span class="nx">n</span><span class="p">.</span><span class="nx">length</span><span class="o">===+</span><span class="nx">n</span><span class="p">.</span><span class="nx">length</span><span class="o">?</span><span class="nx">n</span><span class="p">.</span><span class="nx">length</span><span class="o">:</span><span class="nx">j</span><span class="p">.</span><span class="nx">keys</span><span class="p">(</span><span class="nx">n</span><span class="p">).</span><span class="nx">length</span><span class="p">},</span><span class="nx">j</span><span class="p">.</span><span class="nx">first</span><span class="o">=</span><span class="nx">j</span><span class="p">.</span><span class="nx">head</span><span class="o">=</span><span class="nx">j</span><span class="p">.</span><span class="nx">take</span><span class="o">=</span><span class="kd">function</span><span class="p">(</span><span class="nx">n</span><span class="p">,</span><span class="nx">t</span><span class="p">,</span><span class="nx">r</span><span class="p">){</span><span class="k">return</span> <span class="kc">null</span><span class="o">==</span><span class="nx">n</span><span class="o">?</span><span class="k">void</span> <span class="mi">0</span><span class="o">:</span><span class="kc">null</span><span class="o">==</span><span class="nx">t</span><span class="o">||</span><span class="nx">r</span><span class="o">?</span><span class="nx">n</span><span class="p">[</span><span class="mi">0</span><span class="p">]</span><span class="o">:</span><span class="nx">o</span><span class="p">.</span><span class="nx">call</span><span class="p">(</span><span class="nx">n</span><span class="p">,</span><span class="mi">0</span><span class="p">,</span><span class="nx">t</span><span class="p">)},</span><span class="nx">j</span><span class="p">.</span><span class="nx">initial</span><span class="o">=</span><span class="kd">function</span><span class="p">(</span><span class="nx">n</span><span class="p">,</span><span class="nx">t</span><span class="p">,</span><span class="nx">r</span><span class="p">){</span><span class="k">return</span> <span class="nx">o</span><span class="p">.</span><span class="nx">call</span><span class="p">(</span><span class="nx">n</span><span class="p">,</span><span class="mi">0</span><span class="p">,</span><span class="nx">n</span><span class="p">.</span><span class="nx">length</span><span class="o">-</span><span class="p">(</span><span class="kc">null</span><span class="o">==</span><span class="nx">t</span><span class="o">||</span><span class="nx">r</span><span class="o">?</span><span class="mi">1</span><span class="o">:</span><span class="nx">t</span><span class="p">))},</span><span class="nx">j</span><span class="p">.</span><span class="nx">last</span><span class="o">=</span><span class="kd">function</span><span class="p">(</span><span class="nx">n</span><span class="p">,</span><span class="nx">t</span><span class="p">,</span><span class="nx">r</span><span class="p">){</span><span class="k">return</span> <span class="kc">null</span><span class="o">==</span><span class="nx">n</span><span class="o">?</span><span class="k">void</span> <span class="mi">0</span><span class="o">:</span><span class="kc">null</span><span class="o">==</span><span class="nx">t</span><span class="o">||</span><span class="nx">r</span><span class="o">?</span><span class="nx">n</span><span class="p">[</span><span class="nx">n</span><span class="p">.</span><span class="nx">length</span><span class="o">-</span><span class="mi">1</span><span class="p">]</span><span class="o">:</span><span class="nx">o</span><span class="p">.</span><span class="nx">call</span><span class="p">(</span><span class="nx">n</span><span class="p">,</span><span class="nb">Math</span><span class="p">.</span><span class="nx">max</span><span class="p">(</span><span class="nx">n</span><span class="p">.</span><span class="nx">length</span><span class="o">-</span><span class="nx">t</span><span class="p">,</span><span class="mi">0</span><span class="p">))},</span><span class="nx">j</span><span class="p">.</span><span class="nx">rest</span><span class="o">=</span><span class="nx">j</span><span class="p">.</span><span class="nx">tail</span><span class="o">=</span><span class="nx">j</span><span class="p">.</span><span class="nx">drop</span><span class="o">=</span><span class="kd">function</span><span class="p">(</span><span class="nx">n</span><span class="p">,</span><span class="nx">t</span><span class="p">,</span><span class="nx">r</span><span class="p">){</span><span class="k">return</span> <span class="nx">o</span><span class="p">.</span><span class="nx">call</span><span class="p">(</span><span class="nx">n</span><span class="p">,</span><span class="kc">null</span><span class="o">==</span><span class="nx">t</span><span class="o">||</span><span class="nx">r</span><span class="o">?</span><span class="mi">1</span><span class="o">:</span><span class="nx">t</span><span class="p">)},</span><span class="nx">j</span><span class="p">.</span><span class="nx">compact</span><span class="o">=</span><span class="kd">function</span><span class="p">(</span><span class="nx">n</span><span class="p">){</span><span class="k">return</span> <span class="nx">j</span><span class="p">.</span><span class="nx">filter</span><span class="p">(</span><span class="nx">n</span><span class="p">,</span><span class="nx">j</span><span class="p">.</span><span class="nx">identity</span><span class="p">)};</span><span class="kd">var</span> <span class="nx">M</span><span class="o">=</span><span class="kd">function</span><span class="p">(</span><span class="nx">n</span><span class="p">,</span><span class="nx">t</span><span class="p">,</span><span class="nx">r</span><span class="p">){</span><span class="k">return</span> <span class="nx">t</span><span class="o">&amp;&amp;</span><span class="nx">j</span><span class="p">.</span><span class="nx">every</span><span class="p">(</span><span class="nx">n</span><span class="p">,</span><span class="nx">j</span><span class="p">.</span><span class="nx">isArray</span><span class="p">)</span><span class="o">?</span><span class="nx">c</span><span class="p">.</span><span class="nx">apply</span><span class="p">(</span><span class="nx">r</span><span class="p">,</span><span class="nx">n</span><span class="p">)</span><span class="o">:</span><span class="p">(</span><span class="nx">A</span><span class="p">(</span><span class="nx">n</span><span class="p">,</span><span class="kd">function</span><span class="p">(</span><span class="nx">n</span><span class="p">){</span><span class="nx">j</span><span class="p">.</span><span class="nx">isArray</span><span class="p">(</span><span class="nx">n</span><span class="p">)</span><span class="o">||</span><span class="nx">j</span><span class="p">.</span><span class="nx">isArguments</span><span class="p">(</span><span class="nx">n</span><span class="p">)</span><span class="o">?</span><span class="nx">t</span><span class="o">?</span><span class="nx">a</span><span class="p">.</span><span class="nx">apply</span><span class="p">(</span><span class="nx">r</span><span class="p">,</span><span class="nx">n</span><span class="p">)</span><span class="o">:</span><span class="nx">M</span><span class="p">(</span><span class="nx">n</span><span class="p">,</span><span class="nx">t</span><span class="p">,</span><span class="nx">r</span><span class="p">)</span><span class="o">:</span><span class="nx">r</span><span class="p">.</span><span class="nx">push</span><span class="p">(</span><span class="nx">n</span><span class="p">)}),</span><span class="nx">r</span><span class="p">)};</span><span class="nx">j</span><span class="p">.</span><span class="nx">flatten</span><span class="o">=</span><span class="kd">function</span><span class="p">(</span><span class="nx">n</span><span class="p">,</span><span class="nx">t</span><span class="p">){</span><span class="k">return</span> <span class="nx">M</span><span class="p">(</span><span class="nx">n</span><span class="p">,</span><span class="nx">t</span><span class="p">,[])},</span><span class="nx">j</span><span class="p">.</span><span class="nx">without</span><span class="o">=</span><span class="kd">function</span><span class="p">(</span><span class="nx">n</span><span class="p">){</span><span class="k">return</span> <span class="nx">j</span><span class="p">.</span><span class="nx">difference</span><span class="p">(</span><span class="nx">n</span><span class="p">,</span><span class="nx">o</span><span class="p">.</span><span class="nx">call</span><span class="p">(</span><span class="nx">arguments</span><span class="p">,</span><span class="mi">1</span><span class="p">))},</span><span class="nx">j</span><span class="p">.</span><span class="nx">uniq</span><span class="o">=</span><span class="nx">j</span><span class="p">.</span><span class="nx">unique</span><span class="o">=</span><span class="kd">function</span><span class="p">(</span><span class="nx">n</span><span class="p">,</span><span class="nx">t</span><span class="p">,</span><span class="nx">r</span><span class="p">,</span><span class="nx">e</span><span class="p">){</span><span class="nx">j</span><span class="p">.</span><span class="nx">isFunction</span><span class="p">(</span><span class="nx">t</span><span class="p">)</span><span class="o">&amp;&amp;</span><span class="p">(</span><span class="nx">e</span><span class="o">=</span><span class="nx">r</span><span class="p">,</span><span class="nx">r</span><span class="o">=</span><span class="nx">t</span><span class="p">,</span><span class="nx">t</span><span class="o">=!</span><span class="mi">1</span><span class="p">);</span><span class="kd">var</span> <span class="nx">u</span><span class="o">=</span><span class="nx">r</span><span class="o">?</span><span class="nx">j</span><span class="p">.</span><span class="nx">map</span><span class="p">(</span><span class="nx">n</span><span class="p">,</span><span class="nx">r</span><span class="p">,</span><span class="nx">e</span><span class="p">)</span><span class="o">:</span><span class="nx">n</span><span class="p">,</span><span class="nx">i</span><span class="o">=</span><span class="p">[],</span><span class="nx">a</span><span class="o">=</span><span class="p">[];</span><span class="k">return</span> <span class="nx">A</span><span class="p">(</span><span class="nx">u</span><span class="p">,</span><span class="kd">function</span><span class="p">(</span><span class="nx">r</span><span class="p">,</span><span class="nx">e</span><span class="p">){(</span><span class="nx">t</span><span class="o">?</span><span class="nx">e</span><span class="o">&amp;&amp;</span><span class="nx">a</span><span class="p">[</span><span class="nx">a</span><span class="p">.</span><span class="nx">length</span><span class="o">-</span><span class="mi">1</span><span class="p">]</span><span class="o">===</span><span class="nx">r</span><span class="o">:</span><span class="nx">j</span><span class="p">.</span><span class="nx">contains</span><span class="p">(</span><span class="nx">a</span><span class="p">,</span><span class="nx">r</span><span class="p">))</span><span class="o">||</span><span class="p">(</span><span class="nx">a</span><span class="p">.</span><span class="nx">push</span><span class="p">(</span><span class="nx">r</span><span class="p">),</span><span class="nx">i</span><span class="p">.</span><span class="nx">push</span><span class="p">(</span><span class="nx">n</span><span class="p">[</span><span class="nx">e</span><span class="p">]))}),</span><span class="nx">i</span><span class="p">},</span><span class="nx">j</span><span class="p">.</span><span class="nx">union</span><span class="o">=</span><span class="kd">function</span><span class="p">(){</span><span class="k">return</span> <span class="nx">j</span><span class="p">.</span><span class="nx">uniq</span><span class="p">(</span><span class="nx">j</span><span class="p">.</span><span class="nx">flatten</span><span class="p">(</span><span class="nx">arguments</span><span class="p">,</span><span class="o">!</span><span class="mi">0</span><span class="p">))},</span><span class="nx">j</span><span class="p">.</span><span class="nx">intersection</span><span class="o">=</span><span class="kd">function</span><span class="p">(</span><span class="nx">n</span><span class="p">){</span><span class="kd">var</span> <span class="nx">t</span><span class="o">=</span><span class="nx">o</span><span class="p">.</span><span class="nx">call</span><span class="p">(</span><span class="nx">arguments</span><span class="p">,</span><span class="mi">1</span><span class="p">);</span><span class="k">return</span> <span class="nx">j</span><span class="p">.</span><span class="nx">filter</span><span class="p">(</span><span class="nx">j</span><span class="p">.</span><span class="nx">uniq</span><span class="p">(</span><span class="nx">n</span><span class="p">),</span><span class="kd">function</span><span class="p">(</span><span class="nx">n</span><span class="p">){</span><span class="k">return</span> <span class="nx">j</span><span class="p">.</span><span class="nx">every</span><span class="p">(</span><span class="nx">t</span><span class="p">,</span><span class="kd">function</span><span class="p">(</span><span class="nx">t</span><span class="p">){</span><span class="k">return</span> <span class="nx">j</span><span class="p">.</span><span class="nx">indexOf</span><span class="p">(</span><span class="nx">t</span><span class="p">,</span><span class="nx">n</span><span class="p">)</span><span class="o">&gt;=</span><span class="mi">0</span><span class="p">})})},</span><span class="nx">j</span><span class="p">.</span><span class="nx">difference</span><span class="o">=</span><span class="kd">function</span><span class="p">(</span><span class="nx">n</span><span class="p">){</span><span class="kd">var</span> <span class="nx">t</span><span class="o">=</span><span class="nx">c</span><span class="p">.</span><span class="nx">apply</span><span class="p">(</span><span class="nx">e</span><span class="p">,</span><span class="nx">o</span><span class="p">.</span><span class="nx">call</span><span class="p">(</span><span class="nx">arguments</span><span class="p">,</span><span class="mi">1</span><span class="p">));</span><span class="k">return</span> <span class="nx">j</span><span class="p">.</span><span class="nx">filter</span><span class="p">(</span><span class="nx">n</span><span class="p">,</span><span class="kd">function</span><span class="p">(</span><span class="nx">n</span><span class="p">){</span><span class="k">return</span><span class="o">!</span><span class="nx">j</span><span class="p">.</span><span class="nx">contains</span><span class="p">(</span><span class="nx">t</span><span class="p">,</span><span class="nx">n</span><span class="p">)})},</span><span class="nx">j</span><span class="p">.</span><span class="nx">zip</span><span class="o">=</span><span class="kd">function</span><span class="p">(){</span><span class="k">for</span><span class="p">(</span><span class="kd">var</span> <span class="nx">n</span><span class="o">=</span><span class="nx">j</span><span class="p">.</span><span class="nx">max</span><span class="p">(</span><span class="nx">j</span><span class="p">.</span><span class="nx">pluck</span><span class="p">(</span><span class="nx">arguments</span><span class="p">,</span><span class="s2">&quot;length&quot;</span><span class="p">).</span><span class="nx">concat</span><span class="p">(</span><span class="mi">0</span><span class="p">)),</span><span class="nx">t</span><span class="o">=</span><span class="k">new</span> <span class="nb">Array</span><span class="p">(</span><span class="nx">n</span><span class="p">),</span><span class="nx">r</span><span class="o">=</span><span class="mi">0</span><span class="p">;</span><span class="nx">n</span><span class="o">&gt;</span><span class="nx">r</span><span class="p">;</span><span class="nx">r</span><span class="o">++</span><span class="p">)</span><span class="nx">t</span><span class="p">[</span><span class="nx">r</span><span class="p">]</span><span class="o">=</span><span class="nx">j</span><span class="p">.</span><span class="nx">pluck</span><span class="p">(</span><span class="nx">arguments</span><span class="p">,</span><span class="s2">&quot;&quot;</span><span class="o">+</span><span class="nx">r</span><span class="p">);</span><span class="k">return</span> <span class="nx">t</span><span class="p">},</span><span class="nx">j</span><span class="p">.</span><span class="nx">object</span><span class="o">=</span><span class="kd">function</span><span class="p">(</span><span class="nx">n</span><span class="p">,</span><span class="nx">t</span><span class="p">){</span><span class="k">if</span><span class="p">(</span><span class="kc">null</span><span class="o">==</span><span class="nx">n</span><span class="p">)</span><span class="k">return</span><span class="p">{};</span><span class="k">for</span><span class="p">(</span><span class="kd">var</span> <span class="nx">r</span><span class="o">=</span><span class="p">{},</span><span class="nx">e</span><span class="o">=</span><span class="mi">0</span><span class="p">,</span><span class="nx">u</span><span class="o">=</span><span class="nx">n</span><span class="p">.</span><span class="nx">length</span><span class="p">;</span><span class="nx">u</span><span class="o">&gt;</span><span class="nx">e</span><span class="p">;</span><span class="nx">e</span><span class="o">++</span><span class="p">)</span><span class="nx">t</span><span class="o">?</span><span class="nx">r</span><span class="p">[</span><span class="nx">n</span><span class="p">[</span><span class="nx">e</span><span class="p">]]</span><span class="o">=</span><span class="nx">t</span><span class="p">[</span><span class="nx">e</span><span class="p">]</span><span class="o">:</span><span class="nx">r</span><span class="p">[</span><span class="nx">n</span><span class="p">[</span><span class="nx">e</span><span class="p">][</span><span class="mi">0</span><span class="p">]]</span><span class="o">=</span><span class="nx">n</span><span class="p">[</span><span class="nx">e</span><span class="p">][</span><span class="mi">1</span><span class="p">];</span><span class="k">return</span> <span class="nx">r</span><span class="p">},</span><span class="nx">j</span><span class="p">.</span><span class="nx">indexOf</span><span class="o">=</span><span class="kd">function</span><span class="p">(</span><span class="nx">n</span><span class="p">,</span><span class="nx">t</span><span class="p">,</span><span class="nx">r</span><span class="p">){</span><span class="k">if</span><span class="p">(</span><span class="kc">null</span><span class="o">==</span><span class="nx">n</span><span class="p">)</span><span class="k">return</span><span class="o">-</span><span class="mi">1</span><span class="p">;</span><span class="kd">var</span> <span class="nx">e</span><span class="o">=</span><span class="mi">0</span><span class="p">,</span><span class="nx">u</span><span class="o">=</span><span class="nx">n</span><span class="p">.</span><span class="nx">length</span><span class="p">;</span><span class="k">if</span><span class="p">(</span><span class="nx">r</span><span class="p">){</span><span class="k">if</span><span class="p">(</span><span class="s2">&quot;number&quot;</span><span class="o">!=</span><span class="k">typeof</span> <span class="nx">r</span><span class="p">)</span><span class="k">return</span> <span class="nx">e</span><span class="o">=</span><span class="nx">j</span><span class="p">.</span><span class="nx">sortedIndex</span><span class="p">(</span><span class="nx">n</span><span class="p">,</span><span class="nx">t</span><span class="p">),</span><span class="nx">n</span><span class="p">[</span><span class="nx">e</span><span class="p">]</span><span class="o">===</span><span class="nx">t</span><span class="o">?</span><span class="nx">e</span><span class="o">:-</span><span class="mi">1</span><span class="p">;</span><span class="nx">e</span><span class="o">=</span><span class="mi">0</span><span class="o">&gt;</span><span class="nx">r</span><span class="o">?</span><span class="nb">Math</span><span class="p">.</span><span class="nx">max</span><span class="p">(</span><span class="mi">0</span><span class="p">,</span><span class="nx">u</span><span class="o">+</span><span class="nx">r</span><span class="p">)</span><span class="o">:</span><span class="nx">r</span><span class="p">}</span><span class="k">if</span><span class="p">(</span><span class="nx">y</span><span class="o">&amp;&amp;</span><span class="nx">n</span><span class="p">.</span><span class="nx">indexOf</span><span class="o">===</span><span class="nx">y</span><span class="p">)</span><span class="k">return</span> <span class="nx">n</span><span class="p">.</span><span class="nx">indexOf</span><span class="p">(</span><span class="nx">t</span><span class="p">,</span><span class="nx">r</span><span class="p">);</span><span class="k">for</span><span class="p">(;</span><span class="nx">u</span><span class="o">&gt;</span><span class="nx">e</span><span class="p">;</span><span class="nx">e</span><span class="o">++</span><span class="p">)</span><span class="k">if</span><span class="p">(</span><span class="nx">n</span><span class="p">[</span><span class="nx">e</span><span class="p">]</span><span class="o">===</span><span class="nx">t</span><span class="p">)</span><span class="k">return</span> <span class="nx">e</span><span class="p">;</span><span class="k">return</span><span class="o">-</span><span class="mi">1</span><span class="p">},</span><span class="nx">j</span><span class="p">.</span><span class="nx">lastIndexOf</span><span class="o">=</span><span class="kd">function</span><span class="p">(</span><span class="nx">n</span><span class="p">,</span><span class="nx">t</span><span class="p">,</span><span class="nx">r</span><span class="p">){</span><span class="k">if</span><span class="p">(</span><span class="kc">null</span><span class="o">==</span><span class="nx">n</span><span class="p">)</span><span class="k">return</span><span class="o">-</span><span class="mi">1</span><span class="p">;</span><span class="kd">var</span> <span class="nx">e</span><span class="o">=</span><span class="kc">null</span><span class="o">!=</span><span class="nx">r</span><span class="p">;</span><span class="k">if</span><span class="p">(</span><span class="nx">b</span><span class="o">&amp;&amp;</span><span class="nx">n</span><span class="p">.</span><span class="nx">lastIndexOf</span><span class="o">===</span><span class="nx">b</span><span class="p">)</span><span class="k">return</span> <span class="nx">e</span><span class="o">?</span><span class="nx">n</span><span class="p">.</span><span class="nx">lastIndexOf</span><span class="p">(</span><span class="nx">t</span><span class="p">,</span><span class="nx">r</span><span class="p">)</span><span class="o">:</span><span class="nx">n</span><span class="p">.</span><span class="nx">lastIndexOf</span><span class="p">(</span><span class="nx">t</span><span class="p">);</span><span class="k">for</span><span class="p">(</span><span class="kd">var</span> <span class="nx">u</span><span class="o">=</span><span class="nx">e</span><span class="o">?</span><span class="nx">r</span><span class="o">:</span><span class="nx">n</span><span class="p">.</span><span class="nx">length</span><span class="p">;</span><span class="nx">u</span><span class="o">--</span><span class="p">;)</span><span class="k">if</span><span class="p">(</span><span class="nx">n</span><span class="p">[</span><span class="nx">u</span><span class="p">]</span><span class="o">===</span><span class="nx">t</span><span class="p">)</span><span class="k">return</span> <span class="nx">u</span><span class="p">;</span><span class="k">return</span><span class="o">-</span><span class="mi">1</span><span class="p">},</span><span class="nx">j</span><span class="p">.</span><span class="nx">range</span><span class="o">=</span><span class="kd">function</span><span class="p">(</span><span class="nx">n</span><span class="p">,</span><span class="nx">t</span><span class="p">,</span><span class="nx">r</span><span class="p">){</span><span class="nx">arguments</span><span class="p">.</span><span class="nx">length</span><span class="o">&lt;=</span><span class="mi">1</span><span class="o">&amp;&amp;</span><span class="p">(</span><span class="nx">t</span><span class="o">=</span><span class="nx">n</span><span class="o">||</span><span class="mi">0</span><span class="p">,</span><span class="nx">n</span><span class="o">=</span><span class="mi">0</span><span class="p">),</span><span class="nx">r</span><span class="o">=</span><span class="nx">arguments</span><span class="p">[</span><span class="mi">2</span><span class="p">]</span><span class="o">||</span><span class="mi">1</span><span class="p">;</span><span class="k">for</span><span class="p">(</span><span class="kd">var</span> <span class="nx">e</span><span class="o">=</span><span class="nb">Math</span><span class="p">.</span><span class="nx">max</span><span class="p">(</span><span class="nb">Math</span><span class="p">.</span><span class="nx">ceil</span><span class="p">((</span><span class="nx">t</span><span class="o">-</span><span class="nx">n</span><span class="p">)</span><span class="o">/</span><span class="nx">r</span><span class="p">),</span><span class="mi">0</span><span class="p">),</span><span class="nx">u</span><span class="o">=</span><span class="mi">0</span><span class="p">,</span><span class="nx">i</span><span class="o">=</span><span class="k">new</span> <span class="nb">Array</span><span class="p">(</span><span class="nx">e</span><span class="p">);</span><span class="nx">e</span><span class="o">&gt;</span><span class="nx">u</span><span class="p">;)</span><span class="nx">i</span><span class="p">[</span><span class="nx">u</span><span class="o">++</span><span class="p">]</span><span class="o">=</span><span class="nx">n</span><span class="p">,</span><span class="nx">n</span><span class="o">+=</span><span class="nx">r</span><span class="p">;</span><span class="k">return</span> <span class="nx">i</span><span class="p">};</span><span class="kd">var</span> <span class="nx">R</span><span class="o">=</span><span class="kd">function</span><span class="p">(){};</span><span class="nx">j</span><span class="p">.</span><span class="nx">bind</span><span class="o">=</span><span class="kd">function</span><span class="p">(</span><span class="nx">n</span><span class="p">,</span><span class="nx">t</span><span class="p">){</span><span class="kd">var</span> <span class="nx">r</span><span class="p">,</span><span class="nx">e</span><span class="p">;</span><span class="k">if</span><span class="p">(</span><span class="nx">_</span><span class="o">&amp;&amp;</span><span class="nx">n</span><span class="p">.</span><span class="nx">bind</span><span class="o">===</span><span class="nx">_</span><span class="p">)</span><span class="k">return</span> <span class="nx">_</span><span class="p">.</span><span class="nx">apply</span><span class="p">(</span><span class="nx">n</span><span class="p">,</span><span class="nx">o</span><span class="p">.</span><span class="nx">call</span><span class="p">(</span><span class="nx">arguments</span><span class="p">,</span><span class="mi">1</span><span class="p">));</span><span class="k">if</span><span class="p">(</span><span class="o">!</span><span class="nx">j</span><span class="p">.</span><span class="nx">isFunction</span><span class="p">(</span><span class="nx">n</span><span class="p">))</span><span class="k">throw</span> <span class="k">new</span> <span class="nx">TypeError</span><span class="p">;</span><span class="k">return</span> <span class="nx">r</span><span class="o">=</span><span class="nx">o</span><span class="p">.</span><span class="nx">call</span><span class="p">(</span><span class="nx">arguments</span><span class="p">,</span><span class="mi">2</span><span class="p">),</span><span class="nx">e</span><span class="o">=</span><span class="kd">function</span><span class="p">(){</span><span class="k">if</span><span class="p">(</span><span class="o">!</span><span class="p">(</span><span class="k">this</span> <span class="k">instanceof</span> <span class="nx">e</span><span class="p">))</span><span class="k">return</span> <span class="nx">n</span><span class="p">.</span><span class="nx">apply</span><span class="p">(</span><span class="nx">t</span><span class="p">,</span><span class="nx">r</span><span class="p">.</span><span class="nx">concat</span><span class="p">(</span><span class="nx">o</span><span class="p">.</span><span class="nx">call</span><span class="p">(</span><span class="nx">arguments</span><span class="p">)));</span><span class="nx">R</span><span class="p">.</span><span class="nx">prototype</span><span class="o">=</span><span class="nx">n</span><span class="p">.</span><span class="nx">prototype</span><span class="p">;</span><span class="kd">var</span> <span class="nx">u</span><span class="o">=</span><span class="k">new</span> <span class="nx">R</span><span class="p">;</span><span class="nx">R</span><span class="p">.</span><span class="nx">prototype</span><span class="o">=</span><span class="kc">null</span><span class="p">;</span><span class="kd">var</span> <span class="nx">i</span><span class="o">=</span><span class="nx">n</span><span class="p">.</span><span class="nx">apply</span><span class="p">(</span><span class="nx">u</span><span class="p">,</span><span class="nx">r</span><span class="p">.</span><span class="nx">concat</span><span class="p">(</span><span class="nx">o</span><span class="p">.</span><span class="nx">call</span><span class="p">(</span><span class="nx">arguments</span><span class="p">)));</span><span class="k">return</span> <span class="nb">Object</span><span class="p">(</span><span class="nx">i</span><span class="p">)</span><span class="o">===</span><span class="nx">i</span><span class="o">?</span><span class="nx">i</span><span class="o">:</span><span class="nx">u</span><span class="p">}},</span><span class="nx">j</span><span class="p">.</span><span class="nx">partial</span><span class="o">=</span><span class="kd">function</span><span class="p">(</span><span class="nx">n</span><span class="p">){</span><span class="kd">var</span> <span class="nx">t</span><span class="o">=</span><span class="nx">o</span><span class="p">.</span><span class="nx">call</span><span class="p">(</span><span class="nx">arguments</span><span class="p">,</span><span class="mi">1</span><span class="p">);</span><span class="k">return</span> <span class="kd">function</span><span class="p">(){</span><span class="k">return</span> <span class="nx">n</span><span class="p">.</span><span class="nx">apply</span><span class="p">(</span><span class="k">this</span><span class="p">,</span><span class="nx">t</span><span class="p">.</span><span class="nx">concat</span><span class="p">(</span><span class="nx">o</span><span class="p">.</span><span class="nx">call</span><span class="p">(</span><span class="nx">arguments</span><span class="p">)))}},</span><span class="nx">j</span><span class="p">.</span><span class="nx">bindAll</span><span class="o">=</span><span class="kd">function</span><span class="p">(</span><span class="nx">n</span><span class="p">){</span><span class="kd">var</span> <span class="nx">t</span><span class="o">=</span><span class="nx">o</span><span class="p">.</span><span class="nx">call</span><span class="p">(</span><span class="nx">arguments</span><span class="p">,</span><span class="mi">1</span><span class="p">);</span><span class="k">if</span><span class="p">(</span><span class="mi">0</span><span class="o">===</span><span class="nx">t</span><span class="p">.</span><span class="nx">length</span><span class="p">)</span><span class="k">throw</span> <span class="k">new</span> <span class="nb">Error</span><span class="p">(</span><span class="s2">&quot;bindAll must be passed function names&quot;</span><span class="p">);</span><span class="k">return</span> <span class="nx">A</span><span class="p">(</span><span class="nx">t</span><span class="p">,</span><span class="kd">function</span><span class="p">(</span><span class="nx">t</span><span class="p">){</span><span class="nx">n</span><span class="p">[</span><span class="nx">t</span><span class="p">]</span><span class="o">=</span><span class="nx">j</span><span class="p">.</span><span class="nx">bind</span><span class="p">(</span><span class="nx">n</span><span class="p">[</span><span class="nx">t</span><span class="p">],</span><span class="nx">n</span><span class="p">)}),</span><span class="nx">n</span><span class="p">},</span><span class="nx">j</span><span class="p">.</span><span class="nx">memoize</span><span class="o">=</span><span class="kd">function</span><span class="p">(</span><span class="nx">n</span><span class="p">,</span><span class="nx">t</span><span class="p">){</span><span class="kd">var</span> <span class="nx">r</span><span class="o">=</span><span class="p">{};</span><span class="k">return</span> <span class="nx">t</span><span class="o">||</span><span class="p">(</span><span class="nx">t</span><span class="o">=</span><span class="nx">j</span><span class="p">.</span><span class="nx">identity</span><span class="p">),</span><span class="kd">function</span><span class="p">(){</span><span class="kd">var</span> <span class="nx">e</span><span class="o">=</span><span class="nx">t</span><span class="p">.</span><span class="nx">apply</span><span class="p">(</span><span class="k">this</span><span class="p">,</span><span class="nx">arguments</span><span class="p">);</span><span class="k">return</span> <span class="nx">j</span><span class="p">.</span><span class="nx">has</span><span class="p">(</span><span class="nx">r</span><span class="p">,</span><span class="nx">e</span><span class="p">)</span><span class="o">?</span><span class="nx">r</span><span class="p">[</span><span class="nx">e</span><span class="p">]</span><span class="o">:</span><span class="nx">r</span><span class="p">[</span><span class="nx">e</span><span class="p">]</span><span class="o">=</span><span class="nx">n</span><span class="p">.</span><span class="nx">apply</span><span class="p">(</span><span class="k">this</span><span class="p">,</span><span class="nx">arguments</span><span class="p">)}},</span><span class="nx">j</span><span class="p">.</span><span class="nx">delay</span><span class="o">=</span><span class="kd">function</span><span class="p">(</span><span class="nx">n</span><span class="p">,</span><span class="nx">t</span><span class="p">){</span><span class="kd">var</span> <span class="nx">r</span><span class="o">=</span><span class="nx">o</span><span class="p">.</span><span class="nx">call</span><span class="p">(</span><span class="nx">arguments</span><span class="p">,</span><span class="mi">2</span><span class="p">);</span><span class="k">return</span> <span class="nx">setTimeout</span><span class="p">(</span><span class="kd">function</span><span class="p">(){</span><span class="k">return</span> <span class="nx">n</span><span class="p">.</span><span class="nx">apply</span><span class="p">(</span><span class="kc">null</span><span class="p">,</span><span class="nx">r</span><span class="p">)},</span><span class="nx">t</span><span class="p">)},</span><span class="nx">j</span><span class="p">.</span><span class="nx">defer</span><span class="o">=</span><span class="kd">function</span><span class="p">(</span><span class="nx">n</span><span class="p">){</span><span class="k">return</span> <span class="nx">j</span><span class="p">.</span><span class="nx">delay</span><span class="p">.</span><span class="nx">apply</span><span class="p">(</span><span class="nx">j</span><span class="p">,[</span><span class="nx">n</span><span class="p">,</span><span class="mi">1</span><span class="p">].</span><span class="nx">concat</span><span class="p">(</span><span class="nx">o</span><span class="p">.</span><span class="nx">call</span><span class="p">(</span><span class="nx">arguments</span><span class="p">,</span><span class="mi">1</span><span class="p">)))},</span><span class="nx">j</span><span class="p">.</span><span class="nx">throttle</span><span class="o">=</span><span class="kd">function</span><span class="p">(</span><span class="nx">n</span><span class="p">,</span><span class="nx">t</span><span class="p">,</span><span class="nx">r</span><span class="p">){</span><span class="kd">var</span> <span class="nx">e</span><span class="p">,</span><span class="nx">u</span><span class="p">,</span><span class="nx">i</span><span class="p">,</span><span class="nx">a</span><span class="o">=</span><span class="kc">null</span><span class="p">,</span><span class="nx">o</span><span class="o">=</span><span class="mi">0</span><span class="p">;</span><span class="nx">r</span><span class="o">||</span><span class="p">(</span><span class="nx">r</span><span class="o">=</span><span class="p">{});</span><span class="kd">var</span> <span class="nx">c</span><span class="o">=</span><span class="kd">function</span><span class="p">(){</span><span class="nx">o</span><span class="o">=</span><span class="nx">r</span><span class="p">.</span><span class="nx">leading</span><span class="o">===!</span><span class="mi">1</span><span class="o">?</span><span class="mi">0</span><span class="o">:</span><span class="k">new</span> <span class="nb">Date</span><span class="p">,</span><span class="nx">a</span><span class="o">=</span><span class="kc">null</span><span class="p">,</span><span class="nx">i</span><span class="o">=</span><span class="nx">n</span><span class="p">.</span><span class="nx">apply</span><span class="p">(</span><span class="nx">e</span><span class="p">,</span><span class="nx">u</span><span class="p">)};</span><span class="k">return</span> <span class="kd">function</span><span class="p">(){</span><span class="kd">var</span> <span class="nx">l</span><span class="o">=</span><span class="k">new</span> <span class="nb">Date</span><span class="p">;</span><span class="nx">o</span><span class="o">||</span><span class="nx">r</span><span class="p">.</span><span class="nx">leading</span><span class="o">!==!</span><span class="mi">1</span><span class="o">||</span><span class="p">(</span><span class="nx">o</span><span class="o">=</span><span class="nx">l</span><span class="p">);</span><span class="kd">var</span> <span class="nx">f</span><span class="o">=</span><span class="nx">t</span><span class="o">-</span><span class="p">(</span><span class="nx">l</span><span class="o">-</span><span class="nx">o</span><span class="p">);</span><span class="k">return</span> <span class="nx">e</span><span class="o">=</span><span class="k">this</span><span class="p">,</span><span class="nx">u</span><span class="o">=</span><span class="nx">arguments</span><span class="p">,</span><span class="mi">0</span><span class="o">&gt;=</span><span class="nx">f</span><span class="o">?</span><span class="p">(</span><span class="nx">clearTimeout</span><span class="p">(</span><span class="nx">a</span><span class="p">),</span><span class="nx">a</span><span class="o">=</span><span class="kc">null</span><span class="p">,</span><span class="nx">o</span><span class="o">=</span><span class="nx">l</span><span class="p">,</span><span class="nx">i</span><span class="o">=</span><span class="nx">n</span><span class="p">.</span><span class="nx">apply</span><span class="p">(</span><span class="nx">e</span><span class="p">,</span><span class="nx">u</span><span class="p">))</span><span class="o">:</span><span class="nx">a</span><span class="o">||</span><span class="nx">r</span><span class="p">.</span><span class="nx">trailing</span><span class="o">===!</span><span class="mi">1</span><span class="o">||</span><span class="p">(</span><span class="nx">a</span><span class="o">=</span><span class="nx">setTimeout</span><span class="p">(</span><span class="nx">c</span><span class="p">,</span><span class="nx">f</span><span class="p">)),</span><span class="nx">i</span><span class="p">}},</span><span class="nx">j</span><span class="p">.</span><span class="nx">debounce</span><span class="o">=</span><span class="kd">function</span><span class="p">(</span><span class="nx">n</span><span class="p">,</span><span class="nx">t</span><span class="p">,</span><span class="nx">r</span><span class="p">){</span><span class="kd">var</span> <span class="nx">e</span><span class="p">,</span><span class="nx">u</span><span class="p">,</span><span class="nx">i</span><span class="p">,</span><span class="nx">a</span><span class="p">,</span><span class="nx">o</span><span class="p">;</span><span class="k">return</span> <span class="kd">function</span><span class="p">(){</span><span class="nx">i</span><span class="o">=</span><span class="k">this</span><span class="p">,</span><span class="nx">u</span><span class="o">=</span><span class="nx">arguments</span><span class="p">,</span><span class="nx">a</span><span class="o">=</span><span class="k">new</span> <span class="nb">Date</span><span class="p">;</span><span class="kd">var</span> <span class="nx">c</span><span class="o">=</span><span class="kd">function</span><span class="p">(){</span><span class="kd">var</span> <span class="nx">l</span><span class="o">=</span><span class="k">new</span> <span class="nb">Date</span><span class="o">-</span><span class="nx">a</span><span class="p">;</span><span class="nx">t</span><span class="o">&gt;</span><span class="nx">l</span><span class="o">?</span><span class="nx">e</span><span class="o">=</span><span class="nx">setTimeout</span><span class="p">(</span><span class="nx">c</span><span class="p">,</span><span class="nx">t</span><span class="o">-</span><span class="nx">l</span><span class="p">)</span><span class="o">:</span><span class="p">(</span><span class="nx">e</span><span class="o">=</span><span class="kc">null</span><span class="p">,</span><span class="nx">r</span><span class="o">||</span><span class="p">(</span><span class="nx">o</span><span class="o">=</span><span class="nx">n</span><span class="p">.</span><span class="nx">apply</span><span class="p">(</span><span class="nx">i</span><span class="p">,</span><span class="nx">u</span><span class="p">)))},</span><span class="nx">l</span><span class="o">=</span><span class="nx">r</span><span class="o">&amp;&amp;!</span><span class="nx">e</span><span class="p">;</span><span class="k">return</span> <span class="nx">e</span><span class="o">||</span><span class="p">(</span><span class="nx">e</span><span class="o">=</span><span class="nx">setTimeout</span><span class="p">(</span><span class="nx">c</span><span class="p">,</span><span class="nx">t</span><span class="p">)),</span><span class="nx">l</span><span class="o">&amp;&amp;</span><span class="p">(</span><span class="nx">o</span><span class="o">=</span><span class="nx">n</span><span class="p">.</span><span class="nx">apply</span><span class="p">(</span><span class="nx">i</span><span class="p">,</span><span class="nx">u</span><span class="p">)),</span><span class="nx">o</span><span class="p">}},</span><span class="nx">j</span><span class="p">.</span><span class="nx">once</span><span class="o">=</span><span class="kd">function</span><span class="p">(</span><span class="nx">n</span><span class="p">){</span><span class="kd">var</span> <span class="nx">t</span><span class="p">,</span><span class="nx">r</span><span class="o">=!</span><span class="mi">1</span><span class="p">;</span><span class="k">return</span> <span class="kd">function</span><span class="p">(){</span><span class="k">return</span> <span class="nx">r</span><span class="o">?</span><span class="nx">t</span><span class="o">:</span><span class="p">(</span><span class="nx">r</span><span class="o">=!</span><span class="mi">0</span><span class="p">,</span><span class="nx">t</span><span class="o">=</span><span class="nx">n</span><span class="p">.</span><span class="nx">apply</span><span class="p">(</span><span class="k">this</span><span class="p">,</span><span class="nx">arguments</span><span class="p">),</span><span class="nx">n</span><span class="o">=</span><span class="kc">null</span><span class="p">,</span><span class="nx">t</span><span class="p">)}},</span><span class="nx">j</span><span class="p">.</span><span class="nx">wrap</span><span class="o">=</span><span class="kd">function</span><span class="p">(</span><span class="nx">n</span><span class="p">,</span><span class="nx">t</span><span class="p">){</span><span class="k">return</span> <span class="kd">function</span><span class="p">(){</span><span class="kd">var</span> <span class="nx">r</span><span class="o">=</span><span class="p">[</span><span class="nx">n</span><span class="p">];</span><span class="k">return</span> <span class="nx">a</span><span class="p">.</span><span class="nx">apply</span><span class="p">(</span><span class="nx">r</span><span class="p">,</span><span class="nx">arguments</span><span class="p">),</span><span class="nx">t</span><span class="p">.</span><span class="nx">apply</span><span class="p">(</span><span class="k">this</span><span class="p">,</span><span class="nx">r</span><span class="p">)}},</span><span class="nx">j</span><span class="p">.</span><span class="nx">compose</span><span class="o">=</span><span class="kd">function</span><span class="p">(){</span><span class="kd">var</span> <span class="nx">n</span><span class="o">=</span><span class="nx">arguments</span><span class="p">;</span><span class="k">return</span> <span class="kd">function</span><span class="p">(){</span><span class="k">for</span><span class="p">(</span><span class="kd">var</span> <span class="nx">t</span><span class="o">=</span><span class="nx">arguments</span><span class="p">,</span><span class="nx">r</span><span class="o">=</span><span class="nx">n</span><span class="p">.</span><span class="nx">length</span><span class="o">-</span><span class="mi">1</span><span class="p">;</span><span class="nx">r</span><span class="o">&gt;=</span><span class="mi">0</span><span class="p">;</span><span class="nx">r</span><span class="o">--</span><span class="p">)</span><span class="nx">t</span><span class="o">=</span><span class="p">[</span><span class="nx">n</span><span class="p">[</span><span class="nx">r</span><span class="p">].</span><span class="nx">apply</span><span class="p">(</span><span class="k">this</span><span class="p">,</span><span class="nx">t</span><span class="p">)];</span><span class="k">return</span> <span class="nx">t</span><span class="p">[</span><span class="mi">0</span><span class="p">]}},</span><span class="nx">j</span><span class="p">.</span><span class="nx">after</span><span class="o">=</span><span class="kd">function</span><span class="p">(</span><span class="nx">n</span><span class="p">,</span><span class="nx">t</span><span class="p">){</span><span class="k">return</span> <span class="kd">function</span><span class="p">(){</span><span class="k">return</span><span class="o">--</span><span class="nx">n</span><span class="o">&lt;</span><span class="mi">1</span><span class="o">?</span><span class="nx">t</span><span class="p">.</span><span class="nx">apply</span><span class="p">(</span><span class="k">this</span><span class="p">,</span><span class="nx">arguments</span><span class="p">)</span><span class="o">:</span><span class="k">void</span> <span class="mi">0</span><span class="p">}},</span><span class="nx">j</span><span class="p">.</span><span class="nx">keys</span><span class="o">=</span><span class="nx">w</span><span class="o">||</span><span class="kd">function</span><span class="p">(</span><span class="nx">n</span><span class="p">){</span><span class="k">if</span><span class="p">(</span><span class="nx">n</span><span class="o">!==</span><span class="nb">Object</span><span class="p">(</span><span class="nx">n</span><span class="p">))</span><span class="k">throw</span> <span class="k">new</span> <span class="nx">TypeError</span><span class="p">(</span><span class="s2">&quot;Invalid object&quot;</span><span class="p">);</span><span class="kd">var</span> <span class="nx">t</span><span class="o">=</span><span class="p">[];</span><span class="k">for</span><span class="p">(</span><span class="kd">var</span> <span class="nx">r</span> <span class="k">in</span> <span class="nx">n</span><span class="p">)</span><span class="nx">j</span><span class="p">.</span><span class="nx">has</span><span class="p">(</span><span class="nx">n</span><span class="p">,</span><span class="nx">r</span><span class="p">)</span><span class="o">&amp;&amp;</span><span class="nx">t</span><span class="p">.</span><span class="nx">push</span><span class="p">(</span><span class="nx">r</span><span class="p">);</span><span class="k">return</span> <span class="nx">t</span><span class="p">},</span><span class="nx">j</span><span class="p">.</span><span class="nx">values</span><span class="o">=</span><span class="kd">function</span><span class="p">(</span><span class="nx">n</span><span class="p">){</span><span class="k">for</span><span class="p">(</span><span class="kd">var</span> <span class="nx">t</span><span class="o">=</span><span class="nx">j</span><span class="p">.</span><span class="nx">keys</span><span class="p">(</span><span class="nx">n</span><span class="p">),</span><span class="nx">r</span><span class="o">=</span><span class="nx">t</span><span class="p">.</span><span class="nx">length</span><span class="p">,</span><span class="nx">e</span><span class="o">=</span><span class="k">new</span> <span class="nb">Array</span><span class="p">(</span><span class="nx">r</span><span class="p">),</span><span class="nx">u</span><span class="o">=</span><span class="mi">0</span><span class="p">;</span><span class="nx">r</span><span class="o">&gt;</span><span class="nx">u</span><span class="p">;</span><span class="nx">u</span><span class="o">++</span><span class="p">)</span><span class="nx">e</span><span class="p">[</span><span class="nx">u</span><span class="p">]</span><span class="o">=</span><span class="nx">n</span><span class="p">[</span><span class="nx">t</span><span class="p">[</span><span class="nx">u</span><span class="p">]];</span><span class="k">return</span> <span class="nx">e</span><span class="p">},</span><span class="nx">j</span><span class="p">.</span><span class="nx">pairs</span><span class="o">=</span><span class="kd">function</span><span class="p">(</span><span class="nx">n</span><span class="p">){</span><span class="k">for</span><span class="p">(</span><span class="kd">var</span> <span class="nx">t</span><span class="o">=</span><span class="nx">j</span><span class="p">.</span><span class="nx">keys</span><span class="p">(</span><span class="nx">n</span><span class="p">),</span><span class="nx">r</span><span class="o">=</span><span class="nx">t</span><span class="p">.</span><span class="nx">length</span><span class="p">,</span><span class="nx">e</span><span class="o">=</span><span class="k">new</span> <span class="nb">Array</span><span class="p">(</span><span class="nx">r</span><span class="p">),</span><span class="nx">u</span><span class="o">=</span><span class="mi">0</span><span class="p">;</span><span class="nx">r</span><span class="o">&gt;</span><span class="nx">u</span><span class="p">;</span><span class="nx">u</span><span class="o">++</span><span class="p">)</span><span class="nx">e</span><span class="p">[</span><span class="nx">u</span><span class="p">]</span><span class="o">=</span><span class="p">[</span><span class="nx">t</span><span class="p">[</span><span class="nx">u</span><span class="p">],</span><span class="nx">n</span><span class="p">[</span><span class="nx">t</span><span class="p">[</span><span class="nx">u</span><span class="p">]]];</span><span class="k">return</span> <span class="nx">e</span><span class="p">},</span><span class="nx">j</span><span class="p">.</span><span class="nx">invert</span><span class="o">=</span><span class="kd">function</span><span class="p">(</span><span class="nx">n</span><span class="p">){</span><span class="k">for</span><span class="p">(</span><span class="kd">var</span> <span class="nx">t</span><span class="o">=</span><span class="p">{},</span><span class="nx">r</span><span class="o">=</span><span class="nx">j</span><span class="p">.</span><span class="nx">keys</span><span class="p">(</span><span class="nx">n</span><span class="p">),</span><span class="nx">e</span><span class="o">=</span><span class="mi">0</span><span class="p">,</span><span class="nx">u</span><span class="o">=</span><span class="nx">r</span><span class="p">.</span><span class="nx">length</span><span class="p">;</span><span class="nx">u</span><span class="o">&gt;</span><span class="nx">e</span><span class="p">;</span><span class="nx">e</span><span class="o">++</span><span class="p">)</span><span class="nx">t</span><span class="p">[</span><span class="nx">n</span><span class="p">[</span><span class="nx">r</span><span class="p">[</span><span class="nx">e</span><span class="p">]]]</span><span class="o">=</span><span class="nx">r</span><span class="p">[</span><span class="nx">e</span><span class="p">];</span><span class="k">return</span> <span class="nx">t</span><span class="p">},</span><span class="nx">j</span><span class="p">.</span><span class="nx">functions</span><span class="o">=</span><span class="nx">j</span><span class="p">.</span><span class="nx">methods</span><span class="o">=</span><span class="kd">function</span><span class="p">(</span><span class="nx">n</span><span class="p">){</span><span class="kd">var</span> <span class="nx">t</span><span class="o">=</span><span class="p">[];</span><span class="k">for</span><span class="p">(</span><span class="kd">var</span> <span class="nx">r</span> <span class="k">in</span> <span class="nx">n</span><span class="p">)</span><span class="nx">j</span><span class="p">.</span><span class="nx">isFunction</span><span class="p">(</span><span class="nx">n</span><span class="p">[</span><span class="nx">r</span><span class="p">])</span><span class="o">&amp;&amp;</span><span class="nx">t</span><span class="p">.</span><span class="nx">push</span><span class="p">(</span><span class="nx">r</span><span class="p">);</span><span class="k">return</span> <span class="nx">t</span><span class="p">.</span><span class="nx">sort</span><span class="p">()},</span><span class="nx">j</span><span class="p">.</span><span class="nx">extend</span><span class="o">=</span><span class="kd">function</span><span class="p">(</span><span class="nx">n</span><span class="p">){</span><span class="k">return</span> <span class="nx">A</span><span class="p">(</span><span class="nx">o</span><span class="p">.</span><span class="nx">call</span><span class="p">(</span><span class="nx">arguments</span><span class="p">,</span><span class="mi">1</span><span class="p">),</span><span class="kd">function</span><span class="p">(</span><span class="nx">t</span><span class="p">){</span><span class="k">if</span><span class="p">(</span><span class="nx">t</span><span class="p">)</span><span class="k">for</span><span class="p">(</span><span class="kd">var</span> <span class="nx">r</span> <span class="k">in</span> <span class="nx">t</span><span class="p">)</span><span class="nx">n</span><span class="p">[</span><span class="nx">r</span><span class="p">]</span><span class="o">=</span><span class="nx">t</span><span class="p">[</span><span class="nx">r</span><span class="p">]}),</span><span class="nx">n</span><span class="p">},</span><span class="nx">j</span><span class="p">.</span><span class="nx">pick</span><span class="o">=</span><span class="kd">function</span><span class="p">(</span><span class="nx">n</span><span class="p">){</span><span class="kd">var</span> <span class="nx">t</span><span class="o">=</span><span class="p">{},</span><span class="nx">r</span><span class="o">=</span><span class="nx">c</span><span class="p">.</span><span class="nx">apply</span><span class="p">(</span><span class="nx">e</span><span class="p">,</span><span class="nx">o</span><span class="p">.</span><span class="nx">call</span><span class="p">(</span><span class="nx">arguments</span><span class="p">,</span><span class="mi">1</span><span class="p">));</span><span class="k">return</span> <span class="nx">A</span><span class="p">(</span><span class="nx">r</span><span class="p">,</span><span class="kd">function</span><span class="p">(</span><span class="nx">r</span><span class="p">){</span><span class="nx">r</span> <span class="k">in</span> <span class="nx">n</span><span class="o">&amp;&amp;</span><span class="p">(</span><span class="nx">t</span><span class="p">[</span><span class="nx">r</span><span class="p">]</span><span class="o">=</span><span class="nx">n</span><span class="p">[</span><span class="nx">r</span><span class="p">])}),</span><span class="nx">t</span><span class="p">},</span><span class="nx">j</span><span class="p">.</span><span class="nx">omit</span><span class="o">=</span><span class="kd">function</span><span class="p">(</span><span class="nx">n</span><span class="p">){</span><span class="kd">var</span> <span class="nx">t</span><span class="o">=</span><span class="p">{},</span><span class="nx">r</span><span class="o">=</span><span class="nx">c</span><span class="p">.</span><span class="nx">apply</span><span class="p">(</span><span class="nx">e</span><span class="p">,</span><span class="nx">o</span><span class="p">.</span><span class="nx">call</span><span class="p">(</span><span class="nx">arguments</span><span class="p">,</span><span class="mi">1</span><span class="p">));</span><span class="k">for</span><span class="p">(</span><span class="kd">var</span> <span class="nx">u</span> <span class="k">in</span> <span class="nx">n</span><span class="p">)</span><span class="nx">j</span><span class="p">.</span><span class="nx">contains</span><span class="p">(</span><span class="nx">r</span><span class="p">,</span><span class="nx">u</span><span class="p">)</span><span class="o">||</span><span class="p">(</span><span class="nx">t</span><span class="p">[</span><span class="nx">u</span><span class="p">]</span><span class="o">=</span><span class="nx">n</span><span class="p">[</span><span class="nx">u</span><span class="p">]);</span><span class="k">return</span> <span class="nx">t</span><span class="p">},</span><span class="nx">j</span><span class="p">.</span><span class="nx">defaults</span><span class="o">=</span><span class="kd">function</span><span class="p">(</span><span class="nx">n</span><span class="p">){</span><span class="k">return</span> <span class="nx">A</span><span class="p">(</span><span class="nx">o</span><span class="p">.</span><span class="nx">call</span><span class="p">(</span><span class="nx">arguments</span><span class="p">,</span><span class="mi">1</span><span class="p">),</span><span class="kd">function</span><span class="p">(</span><span class="nx">t</span><span class="p">){</span><span class="k">if</span><span class="p">(</span><span class="nx">t</span><span class="p">)</span><span class="k">for</span><span class="p">(</span><span class="kd">var</span> <span class="nx">r</span> <span class="k">in</span> <span class="nx">t</span><span class="p">)</span><span class="nx">n</span><span class="p">[</span><span class="nx">r</span><span class="p">]</span><span class="o">===</span><span class="k">void</span> <span class="mi">0</span><span class="o">&amp;&amp;</span><span class="p">(</span><span class="nx">n</span><span class="p">[</span><span class="nx">r</span><span class="p">]</span><span class="o">=</span><span class="nx">t</span><span class="p">[</span><span class="nx">r</span><span class="p">])}),</span><span class="nx">n</span><span class="p">},</span><span class="nx">j</span><span class="p">.</span><span class="nx">clone</span><span class="o">=</span><span class="kd">function</span><span class="p">(</span><span class="nx">n</span><span class="p">){</span><span class="k">return</span> <span class="nx">j</span><span class="p">.</span><span class="nx">isObject</span><span class="p">(</span><span class="nx">n</span><span class="p">)</span><span class="o">?</span><span class="nx">j</span><span class="p">.</span><span class="nx">isArray</span><span class="p">(</span><span class="nx">n</span><span class="p">)</span><span class="o">?</span><span class="nx">n</span><span class="p">.</span><span class="nx">slice</span><span class="p">()</span><span class="o">:</span><span class="nx">j</span><span class="p">.</span><span class="nx">extend</span><span class="p">({},</span><span class="nx">n</span><span class="p">)</span><span class="o">:</span><span class="nx">n</span><span class="p">},</span><span class="nx">j</span><span class="p">.</span><span class="nx">tap</span><span class="o">=</span><span class="kd">function</span><span class="p">(</span><span class="nx">n</span><span class="p">,</span><span class="nx">t</span><span class="p">){</span><span class="k">return</span> <span class="nx">t</span><span class="p">(</span><span class="nx">n</span><span class="p">),</span><span class="nx">n</span><span class="p">};</span><span class="kd">var</span> <span class="nx">S</span><span class="o">=</span><span class="kd">function</span><span class="p">(</span><span class="nx">n</span><span class="p">,</span><span class="nx">t</span><span class="p">,</span><span class="nx">r</span><span class="p">,</span><span class="nx">e</span><span class="p">){</span><span class="k">if</span><span class="p">(</span><span class="nx">n</span><span class="o">===</span><span class="nx">t</span><span class="p">)</span><span class="k">return</span> <span class="mi">0</span><span class="o">!==</span><span class="nx">n</span><span class="o">||</span><span class="mi">1</span><span class="o">/</span><span class="nx">n</span><span class="o">==</span><span class="mi">1</span><span class="o">/</span><span class="nx">t</span><span class="p">;</span><span class="k">if</span><span class="p">(</span><span class="kc">null</span><span class="o">==</span><span class="nx">n</span><span class="o">||</span><span class="kc">null</span><span class="o">==</span><span class="nx">t</span><span class="p">)</span><span class="k">return</span> <span class="nx">n</span><span class="o">===</span><span class="nx">t</span><span class="p">;</span><span class="nx">n</span> <span class="k">instanceof</span> <span class="nx">j</span><span class="o">&amp;&amp;</span><span class="p">(</span><span class="nx">n</span><span class="o">=</span><span class="nx">n</span><span class="p">.</span><span class="nx">_wrapped</span><span class="p">),</span><span class="nx">t</span> <span class="k">instanceof</span> <span class="nx">j</span><span class="o">&amp;&amp;</span><span class="p">(</span><span class="nx">t</span><span class="o">=</span><span class="nx">t</span><span class="p">.</span><span class="nx">_wrapped</span><span class="p">);</span><span class="kd">var</span> <span class="nx">u</span><span class="o">=</span><span class="nx">l</span><span class="p">.</span><span class="nx">call</span><span class="p">(</span><span class="nx">n</span><span class="p">);</span><span class="k">if</span><span class="p">(</span><span class="nx">u</span><span class="o">!=</span><span class="nx">l</span><span class="p">.</span><span class="nx">call</span><span class="p">(</span><span class="nx">t</span><span class="p">))</span><span class="k">return</span><span class="o">!</span><span class="mi">1</span><span class="p">;</span><span class="k">switch</span><span class="p">(</span><span class="nx">u</span><span class="p">){</span><span class="k">case</span><span class="s2">&quot;[object String]&quot;</span><span class="o">:</span><span class="k">return</span> <span class="nx">n</span><span class="o">==</span><span class="nb">String</span><span class="p">(</span><span class="nx">t</span><span class="p">);</span><span class="k">case</span><span class="s2">&quot;[object Number]&quot;</span><span class="o">:</span><span class="k">return</span> <span class="nx">n</span><span class="o">!=+</span><span class="nx">n</span><span class="o">?</span><span class="nx">t</span><span class="o">!=+</span><span class="nx">t</span><span class="o">:</span><span class="mi">0</span><span class="o">==</span><span class="nx">n</span><span class="o">?</span><span class="mi">1</span><span class="o">/</span><span class="nx">n</span><span class="o">==</span><span class="mi">1</span><span class="o">/</span><span class="nx">t</span><span class="o">:</span><span class="nx">n</span><span class="o">==+</span><span class="nx">t</span><span class="p">;</span><span class="k">case</span><span class="s2">&quot;[object Date]&quot;</span><span class="o">:</span><span class="k">case</span><span class="s2">&quot;[object Boolean]&quot;</span><span class="o">:</span><span class="k">return</span><span class="o">+</span><span class="nx">n</span><span class="o">==+</span><span class="nx">t</span><span class="p">;</span><span class="k">case</span><span class="s2">&quot;[object RegExp]&quot;</span><span class="o">:</span><span class="k">return</span> <span class="nx">n</span><span class="p">.</span><span class="nx">source</span><span class="o">==</span><span class="nx">t</span><span class="p">.</span><span class="nx">source</span><span class="o">&amp;&amp;</span><span class="nx">n</span><span class="p">.</span><span class="nx">global</span><span class="o">==</span><span class="nx">t</span><span class="p">.</span><span class="nx">global</span><span class="o">&amp;&amp;</span><span class="nx">n</span><span class="p">.</span><span class="nx">multiline</span><span class="o">==</span><span class="nx">t</span><span class="p">.</span><span class="nx">multiline</span><span class="o">&amp;&amp;</span><span class="nx">n</span><span class="p">.</span><span class="nx">ignoreCase</span><span class="o">==</span><span class="nx">t</span><span class="p">.</span><span class="nx">ignoreCase</span><span class="p">}</span><span class="k">if</span><span class="p">(</span><span class="s2">&quot;object&quot;</span><span class="o">!=</span><span class="k">typeof</span> <span class="nx">n</span><span class="o">||</span><span class="s2">&quot;object&quot;</span><span class="o">!=</span><span class="k">typeof</span> <span class="nx">t</span><span class="p">)</span><span class="k">return</span><span class="o">!</span><span class="mi">1</span><span class="p">;</span><span class="k">for</span><span class="p">(</span><span class="kd">var</span> <span class="nx">i</span><span class="o">=</span><span class="nx">r</span><span class="p">.</span><span class="nx">length</span><span class="p">;</span><span class="nx">i</span><span class="o">--</span><span class="p">;)</span><span class="k">if</span><span class="p">(</span><span class="nx">r</span><span class="p">[</span><span class="nx">i</span><span class="p">]</span><span class="o">==</span><span class="nx">n</span><span class="p">)</span><span class="k">return</span> <span class="nx">e</span><span class="p">[</span><span class="nx">i</span><span class="p">]</span><span class="o">==</span><span class="nx">t</span><span class="p">;</span><span class="kd">var</span> <span class="nx">a</span><span class="o">=</span><span class="nx">n</span><span class="p">.</span><span class="nx">constructor</span><span class="p">,</span><span class="nx">o</span><span class="o">=</span><span class="nx">t</span><span class="p">.</span><span class="nx">constructor</span><span class="p">;</span><span class="k">if</span><span class="p">(</span><span class="nx">a</span><span class="o">!==</span><span class="nx">o</span><span class="o">&amp;&amp;!</span><span class="p">(</span><span class="nx">j</span><span class="p">.</span><span class="nx">isFunction</span><span class="p">(</span><span class="nx">a</span><span class="p">)</span><span class="o">&amp;&amp;</span><span class="nx">a</span> <span class="k">instanceof</span> <span class="nx">a</span><span class="o">&amp;&amp;</span><span class="nx">j</span><span class="p">.</span><span class="nx">isFunction</span><span class="p">(</span><span class="nx">o</span><span class="p">)</span><span class="o">&amp;&amp;</span><span class="nx">o</span> <span class="k">instanceof</span> <span class="nx">o</span><span class="p">))</span><span class="k">return</span><span class="o">!</span><span class="mi">1</span><span class="p">;</span><span class="nx">r</span><span class="p">.</span><span class="nx">push</span><span class="p">(</span><span class="nx">n</span><span class="p">),</span><span class="nx">e</span><span class="p">.</span><span class="nx">push</span><span class="p">(</span><span class="nx">t</span><span class="p">);</span><span class="kd">var</span> <span class="nx">c</span><span class="o">=</span><span class="mi">0</span><span class="p">,</span><span class="nx">f</span><span class="o">=!</span><span class="mi">0</span><span class="p">;</span><span class="k">if</span><span class="p">(</span><span class="s2">&quot;[object Array]&quot;</span><span class="o">==</span><span class="nx">u</span><span class="p">){</span><span class="k">if</span><span class="p">(</span><span class="nx">c</span><span class="o">=</span><span class="nx">n</span><span class="p">.</span><span class="nx">length</span><span class="p">,</span><span class="nx">f</span><span class="o">=</span><span class="nx">c</span><span class="o">==</span><span class="nx">t</span><span class="p">.</span><span class="nx">length</span><span class="p">)</span><span class="k">for</span><span class="p">(;</span><span class="nx">c</span><span class="o">--&amp;&amp;</span><span class="p">(</span><span class="nx">f</span><span class="o">=</span><span class="nx">S</span><span class="p">(</span><span class="nx">n</span><span class="p">[</span><span class="nx">c</span><span class="p">],</span><span class="nx">t</span><span class="p">[</span><span class="nx">c</span><span class="p">],</span><span class="nx">r</span><span class="p">,</span><span class="nx">e</span><span class="p">)););}</span><span class="k">else</span><span class="p">{</span><span class="k">for</span><span class="p">(</span><span class="kd">var</span> <span class="nx">s</span> <span class="k">in</span> <span class="nx">n</span><span class="p">)</span><span class="k">if</span><span class="p">(</span><span class="nx">j</span><span class="p">.</span><span class="nx">has</span><span class="p">(</span><span class="nx">n</span><span class="p">,</span><span class="nx">s</span><span class="p">)</span><span class="o">&amp;&amp;</span><span class="p">(</span><span class="nx">c</span><span class="o">++</span><span class="p">,</span><span class="o">!</span><span class="p">(</span><span class="nx">f</span><span class="o">=</span><span class="nx">j</span><span class="p">.</span><span class="nx">has</span><span class="p">(</span><span class="nx">t</span><span class="p">,</span><span class="nx">s</span><span class="p">)</span><span class="o">&amp;&amp;</span><span class="nx">S</span><span class="p">(</span><span class="nx">n</span><span class="p">[</span><span class="nx">s</span><span class="p">],</span><span class="nx">t</span><span class="p">[</span><span class="nx">s</span><span class="p">],</span><span class="nx">r</span><span class="p">,</span><span class="nx">e</span><span class="p">))))</span><span class="k">break</span><span class="p">;</span><span class="k">if</span><span class="p">(</span><span class="nx">f</span><span class="p">){</span><span class="k">for</span><span class="p">(</span><span class="nx">s</span> <span class="k">in</span> <span class="nx">t</span><span class="p">)</span><span class="k">if</span><span class="p">(</span><span class="nx">j</span><span class="p">.</span><span class="nx">has</span><span class="p">(</span><span class="nx">t</span><span class="p">,</span><span class="nx">s</span><span class="p">)</span><span class="o">&amp;&amp;!</span><span class="nx">c</span><span class="o">--</span><span class="p">)</span><span class="k">break</span><span class="p">;</span><span class="nx">f</span><span class="o">=!</span><span class="nx">c</span><span class="p">}}</span><span class="k">return</span> <span class="nx">r</span><span class="p">.</span><span class="nx">pop</span><span class="p">(),</span><span class="nx">e</span><span class="p">.</span><span class="nx">pop</span><span class="p">(),</span><span class="nx">f</span><span class="p">};</span><span class="nx">j</span><span class="p">.</span><span class="nx">isEqual</span><span class="o">=</span><span class="kd">function</span><span class="p">(</span><span class="nx">n</span><span class="p">,</span><span class="nx">t</span><span class="p">){</span><span class="k">return</span> <span class="nx">S</span><span class="p">(</span><span class="nx">n</span><span class="p">,</span><span class="nx">t</span><span class="p">,[],[])},</span><span class="nx">j</span><span class="p">.</span><span class="nx">isEmpty</span><span class="o">=</span><span class="kd">function</span><span class="p">(</span><span class="nx">n</span><span class="p">){</span><span class="k">if</span><span class="p">(</span><span class="kc">null</span><span class="o">==</span><span class="nx">n</span><span class="p">)</span><span class="k">return</span><span class="o">!</span><span class="mi">0</span><span class="p">;</span><span class="k">if</span><span class="p">(</span><span class="nx">j</span><span class="p">.</span><span class="nx">isArray</span><span class="p">(</span><span class="nx">n</span><span class="p">)</span><span class="o">||</span><span class="nx">j</span><span class="p">.</span><span class="nx">isString</span><span class="p">(</span><span class="nx">n</span><span class="p">))</span><span class="k">return</span> <span class="mi">0</span><span class="o">===</span><span class="nx">n</span><span class="p">.</span><span class="nx">length</span><span class="p">;</span><span class="k">for</span><span class="p">(</span><span class="kd">var</span> <span class="nx">t</span> <span class="k">in</span> <span class="nx">n</span><span class="p">)</span><span class="k">if</span><span class="p">(</span><span class="nx">j</span><span class="p">.</span><span class="nx">has</span><span class="p">(</span><span class="nx">n</span><span class="p">,</span><span class="nx">t</span><span class="p">))</span><span class="k">return</span><span class="o">!</span><span class="mi">1</span><span class="p">;</span><span class="k">return</span><span class="o">!</span><span class="mi">0</span><span class="p">},</span><span class="nx">j</span><span class="p">.</span><span class="nx">isElement</span><span class="o">=</span><span class="kd">function</span><span class="p">(</span><span class="nx">n</span><span class="p">){</span><span class="k">return</span><span class="o">!</span><span class="p">(</span><span class="o">!</span><span class="nx">n</span><span class="o">||</span><span class="mi">1</span><span class="o">!==</span><span class="nx">n</span><span class="p">.</span><span class="nx">nodeType</span><span class="p">)},</span><span class="nx">j</span><span class="p">.</span><span class="nx">isArray</span><span class="o">=</span><span class="nx">x</span><span class="o">||</span><span class="kd">function</span><span class="p">(</span><span class="nx">n</span><span class="p">){</span><span class="k">return</span><span class="s2">&quot;[object Array]&quot;</span><span class="o">==</span><span class="nx">l</span><span class="p">.</span><span class="nx">call</span><span class="p">(</span><span class="nx">n</span><span class="p">)},</span><span class="nx">j</span><span class="p">.</span><span class="nx">isObject</span><span class="o">=</span><span class="kd">function</span><span class="p">(</span><span class="nx">n</span><span class="p">){</span><span class="k">return</span> <span class="nx">n</span><span class="o">===</span><span class="nb">Object</span><span class="p">(</span><span class="nx">n</span><span class="p">)},</span><span class="nx">A</span><span class="p">([</span><span class="s2">&quot;Arguments&quot;</span><span class="p">,</span><span class="s2">&quot;Function&quot;</span><span class="p">,</span><span class="s2">&quot;String&quot;</span><span class="p">,</span><span class="s2">&quot;Number&quot;</span><span class="p">,</span><span class="s2">&quot;Date&quot;</span><span class="p">,</span><span class="s2">&quot;RegExp&quot;</span><span class="p">],</span><span class="kd">function</span><span class="p">(</span><span class="nx">n</span><span class="p">){</span><span class="nx">j</span><span class="p">[</span><span class="s2">&quot;is&quot;</span><span class="o">+</span><span class="nx">n</span><span class="p">]</span><span class="o">=</span><span class="kd">function</span><span class="p">(</span><span class="nx">t</span><span class="p">){</span><span class="k">return</span> <span class="nx">l</span><span class="p">.</span><span class="nx">call</span><span class="p">(</span><span class="nx">t</span><span class="p">)</span><span class="o">==</span><span class="s2">&quot;[object &quot;</span><span class="o">+</span><span class="nx">n</span><span class="o">+</span><span class="s2">&quot;]&quot;</span><span class="p">}}),</span><span class="nx">j</span><span class="p">.</span><span class="nx">isArguments</span><span class="p">(</span><span class="nx">arguments</span><span class="p">)</span><span class="o">||</span><span class="p">(</span><span class="nx">j</span><span class="p">.</span><span class="nx">isArguments</span><span class="o">=</span><span class="kd">function</span><span class="p">(</span><span class="nx">n</span><span class="p">){</span><span class="k">return</span><span class="o">!</span><span class="p">(</span><span class="o">!</span><span class="nx">n</span><span class="o">||!</span><span class="nx">j</span><span class="p">.</span><span class="nx">has</span><span class="p">(</span><span class="nx">n</span><span class="p">,</span><span class="s2">&quot;callee&quot;</span><span class="p">))}),</span><span class="s2">&quot;function&quot;</span><span class="o">!=</span><span class="k">typeof</span><span class="sr">/./</span><span class="o">&amp;&amp;</span><span class="p">(</span><span class="nx">j</span><span class="p">.</span><span class="nx">isFunction</span><span class="o">=</span><span class="kd">function</span><span class="p">(</span><span class="nx">n</span><span class="p">){</span><span class="k">return</span><span class="s2">&quot;function&quot;</span><span class="o">==</span><span class="k">typeof</span> <span class="nx">n</span><span class="p">}),</span><span class="nx">j</span><span class="p">.</span><span class="nb">isFinite</span><span class="o">=</span><span class="kd">function</span><span class="p">(</span><span class="nx">n</span><span class="p">){</span><span class="k">return</span> <span class="nb">isFinite</span><span class="p">(</span><span class="nx">n</span><span class="p">)</span><span class="o">&amp;&amp;!</span><span class="nb">isNaN</span><span class="p">(</span><span class="nb">parseFloat</span><span class="p">(</span><span class="nx">n</span><span class="p">))},</span><span class="nx">j</span><span class="p">.</span><span class="nb">isNaN</span><span class="o">=</span><span class="kd">function</span><span class="p">(</span><span class="nx">n</span><span class="p">){</span><span class="k">return</span> <span class="nx">j</span><span class="p">.</span><span class="nx">isNumber</span><span class="p">(</span><span class="nx">n</span><span class="p">)</span><span class="o">&amp;&amp;</span><span class="nx">n</span><span class="o">!=+</span><span class="nx">n</span><span class="p">},</span><span class="nx">j</span><span class="p">.</span><span class="nx">isBoolean</span><span class="o">=</span><span class="kd">function</span><span class="p">(</span><span class="nx">n</span><span class="p">){</span><span class="k">return</span> <span class="nx">n</span><span class="o">===!</span><span class="mi">0</span><span class="o">||</span><span class="nx">n</span><span class="o">===!</span><span class="mi">1</span><span class="o">||</span><span class="s2">&quot;[object Boolean]&quot;</span><span class="o">==</span><span class="nx">l</span><span class="p">.</span><span class="nx">call</span><span class="p">(</span><span class="nx">n</span><span class="p">)},</span><span class="nx">j</span><span class="p">.</span><span class="nx">isNull</span><span class="o">=</span><span class="kd">function</span><span class="p">(</span><span class="nx">n</span><span class="p">){</span><span class="k">return</span> <span class="kc">null</span><span class="o">===</span><span class="nx">n</span><span class="p">},</span><span class="nx">j</span><span class="p">.</span><span class="nx">isUndefined</span><span class="o">=</span><span class="kd">function</span><span class="p">(</span><span class="nx">n</span><span class="p">){</span><span class="k">return</span> <span class="nx">n</span><span class="o">===</span><span class="k">void</span> <span class="mi">0</span><span class="p">},</span><span class="nx">j</span><span class="p">.</span><span class="nx">has</span><span class="o">=</span><span class="kd">function</span><span class="p">(</span><span class="nx">n</span><span class="p">,</span><span class="nx">t</span><span class="p">){</span><span class="k">return</span> <span class="nx">f</span><span class="p">.</span><span class="nx">call</span><span class="p">(</span><span class="nx">n</span><span class="p">,</span><span class="nx">t</span><span class="p">)},</span><span class="nx">j</span><span class="p">.</span><span class="nx">noConflict</span><span class="o">=</span><span class="kd">function</span><span class="p">(){</span><span class="k">return</span> <span class="nx">n</span><span class="p">.</span><span class="nx">_</span><span class="o">=</span><span class="nx">t</span><span class="p">,</span><span class="k">this</span><span class="p">},</span><span class="nx">j</span><span class="p">.</span><span class="nx">identity</span><span class="o">=</span><span class="kd">function</span><span class="p">(</span><span class="nx">n</span><span class="p">){</span><span class="k">return</span> <span class="nx">n</span><span class="p">},</span><span class="nx">j</span><span class="p">.</span><span class="nx">times</span><span class="o">=</span><span class="kd">function</span><span class="p">(</span><span class="nx">n</span><span class="p">,</span><span class="nx">t</span><span class="p">,</span><span class="nx">r</span><span class="p">){</span><span class="k">for</span><span class="p">(</span><span class="kd">var</span> <span class="nx">e</span><span class="o">=</span><span class="nb">Array</span><span class="p">(</span><span class="nb">Math</span><span class="p">.</span><span class="nx">max</span><span class="p">(</span><span class="mi">0</span><span class="p">,</span><span class="nx">n</span><span class="p">)),</span><span class="nx">u</span><span class="o">=</span><span class="mi">0</span><span class="p">;</span><span class="nx">n</span><span class="o">&gt;</span><span class="nx">u</span><span class="p">;</span><span class="nx">u</span><span class="o">++</span><span class="p">)</span><span class="nx">e</span><span class="p">[</span><span class="nx">u</span><span class="p">]</span><span class="o">=</span><span class="nx">t</span><span class="p">.</span><span class="nx">call</span><span class="p">(</span><span class="nx">r</span><span class="p">,</span><span class="nx">u</span><span class="p">);</span><span class="k">return</span> <span class="nx">e</span><span class="p">},</span><span class="nx">j</span><span class="p">.</span><span class="nx">random</span><span class="o">=</span><span class="kd">function</span><span class="p">(</span><span class="nx">n</span><span class="p">,</span><span class="nx">t</span><span class="p">){</span><span class="k">return</span> <span class="kc">null</span><span class="o">==</span><span class="nx">t</span><span class="o">&amp;&amp;</span><span class="p">(</span><span class="nx">t</span><span class="o">=</span><span class="nx">n</span><span class="p">,</span><span class="nx">n</span><span class="o">=</span><span class="mi">0</span><span class="p">),</span><span class="nx">n</span><span class="o">+</span><span class="nb">Math</span><span class="p">.</span><span class="nx">floor</span><span class="p">(</span><span class="nb">Math</span><span class="p">.</span><span class="nx">random</span><span class="p">()</span><span class="o">*</span><span class="p">(</span><span class="nx">t</span><span class="o">-</span><span class="nx">n</span><span class="o">+</span><span class="mi">1</span><span class="p">))};</span><span class="kd">var</span> <span class="nx">I</span><span class="o">=</span><span class="p">{</span><span class="nx">escape</span><span class="o">:</span><span class="p">{</span><span class="s2">&quot;&amp;&quot;</span><span class="o">:</span><span class="s2">&quot;&amp;amp;&quot;</span><span class="p">,</span><span class="s2">&quot;&lt;&quot;</span><span class="o">:</span><span class="s2">&quot;&amp;lt;&quot;</span><span class="p">,</span><span class="s2">&quot;&gt;&quot;</span><span class="o">:</span><span class="s2">&quot;&amp;gt;&quot;</span><span class="p">,</span><span class="s1">&#39;&quot;&#39;</span><span class="o">:</span><span class="s2">&quot;&amp;quot;&quot;</span><span class="p">,</span><span class="s2">&quot;&#39;&quot;</span><span class="o">:</span><span class="s2">&quot;&amp;#x27;&quot;</span><span class="p">}};</span><span class="nx">I</span><span class="p">.</span><span class="nx">unescape</span><span class="o">=</span><span class="nx">j</span><span class="p">.</span><span class="nx">invert</span><span class="p">(</span><span class="nx">I</span><span class="p">.</span><span class="nx">escape</span><span class="p">);</span><span class="kd">var</span> <span class="nx">T</span><span class="o">=</span><span class="p">{</span><span class="nx">escape</span><span class="o">:</span><span class="k">new</span> <span class="nb">RegExp</span><span class="p">(</span><span class="s2">&quot;[&quot;</span><span class="o">+</span><span class="nx">j</span><span class="p">.</span><span class="nx">keys</span><span class="p">(</span><span class="nx">I</span><span class="p">.</span><span class="nx">escape</span><span class="p">).</span><span class="nx">join</span><span class="p">(</span><span class="s2">&quot;&quot;</span><span class="p">)</span><span class="o">+</span><span class="s2">&quot;]&quot;</span><span class="p">,</span><span class="s2">&quot;g&quot;</span><span class="p">),</span><span class="nx">unescape</span><span class="o">:</span><span class="k">new</span> <span class="nb">RegExp</span><span class="p">(</span><span class="s2">&quot;(&quot;</span><span class="o">+</span><span class="nx">j</span><span class="p">.</span><span class="nx">keys</span><span class="p">(</span><span class="nx">I</span><span class="p">.</span><span class="nx">unescape</span><span class="p">).</span><span class="nx">join</span><span class="p">(</span><span class="s2">&quot;|&quot;</span><span class="p">)</span><span class="o">+</span><span class="s2">&quot;)&quot;</span><span class="p">,</span><span class="s2">&quot;g&quot;</span><span class="p">)};</span><span class="nx">j</span><span class="p">.</span><span class="nx">each</span><span class="p">([</span><span class="s2">&quot;escape&quot;</span><span class="p">,</span><span class="s2">&quot;unescape&quot;</span><span class="p">],</span><span class="kd">function</span><span class="p">(</span><span class="nx">n</span><span class="p">){</span><span class="nx">j</span><span class="p">[</span><span class="nx">n</span><span class="p">]</span><span class="o">=</span><span class="kd">function</span><span class="p">(</span><span class="nx">t</span><span class="p">){</span><span class="k">return</span> <span class="kc">null</span><span class="o">==</span><span class="nx">t</span><span class="o">?</span><span class="s2">&quot;&quot;</span><span class="o">:</span><span class="p">(</span><span class="s2">&quot;&quot;</span><span class="o">+</span><span class="nx">t</span><span class="p">).</span><span class="nx">replace</span><span class="p">(</span><span class="nx">T</span><span class="p">[</span><span class="nx">n</span><span class="p">],</span><span class="kd">function</span><span class="p">(</span><span class="nx">t</span><span class="p">){</span><span class="k">return</span> <span class="nx">I</span><span class="p">[</span><span class="nx">n</span><span class="p">][</span><span class="nx">t</span><span class="p">]})}}),</span><span class="nx">j</span><span class="p">.</span><span class="nx">result</span><span class="o">=</span><span class="kd">function</span><span class="p">(</span><span class="nx">n</span><span class="p">,</span><span class="nx">t</span><span class="p">){</span><span class="k">if</span><span class="p">(</span><span class="kc">null</span><span class="o">==</span><span class="nx">n</span><span class="p">)</span><span class="k">return</span> <span class="k">void</span> <span class="mi">0</span><span class="p">;</span><span class="kd">var</span> <span class="nx">r</span><span class="o">=</span><span class="nx">n</span><span class="p">[</span><span class="nx">t</span><span class="p">];</span><span class="k">return</span> <span class="nx">j</span><span class="p">.</span><span class="nx">isFunction</span><span class="p">(</span><span class="nx">r</span><span class="p">)</span><span class="o">?</span><span class="nx">r</span><span class="p">.</span><span class="nx">call</span><span class="p">(</span><span class="nx">n</span><span class="p">)</span><span class="o">:</span><span class="nx">r</span><span class="p">},</span><span class="nx">j</span><span class="p">.</span><span class="nx">mixin</span><span class="o">=</span><span class="kd">function</span><span class="p">(</span><span class="nx">n</span><span class="p">){</span><span class="nx">A</span><span class="p">(</span><span class="nx">j</span><span class="p">.</span><span class="nx">functions</span><span class="p">(</span><span class="nx">n</span><span class="p">),</span><span class="kd">function</span><span class="p">(</span><span class="nx">t</span><span class="p">){</span><span class="kd">var</span> <span class="nx">r</span><span class="o">=</span><span class="nx">j</span><span class="p">[</span><span class="nx">t</span><span class="p">]</span><span class="o">=</span><span class="nx">n</span><span class="p">[</span><span class="nx">t</span><span class="p">];</span><span class="nx">j</span><span class="p">.</span><span class="nx">prototype</span><span class="p">[</span><span class="nx">t</span><span class="p">]</span><span class="o">=</span><span class="kd">function</span><span class="p">(){</span><span class="kd">var</span> <span class="nx">n</span><span class="o">=</span><span class="p">[</span><span class="k">this</span><span class="p">.</span><span class="nx">_wrapped</span><span class="p">];</span><span class="k">return</span> <span class="nx">a</span><span class="p">.</span><span class="nx">apply</span><span class="p">(</span><span class="nx">n</span><span class="p">,</span><span class="nx">arguments</span><span class="p">),</span><span class="nx">z</span><span class="p">.</span><span class="nx">call</span><span class="p">(</span><span class="k">this</span><span class="p">,</span><span class="nx">r</span><span class="p">.</span><span class="nx">apply</span><span class="p">(</span><span class="nx">j</span><span class="p">,</span><span class="nx">n</span><span class="p">))}})};</span><span class="kd">var</span> <span class="nx">N</span><span class="o">=</span><span class="mi">0</span><span class="p">;</span><span class="nx">j</span><span class="p">.</span><span class="nx">uniqueId</span><span class="o">=</span><span class="kd">function</span><span class="p">(</span><span class="nx">n</span><span class="p">){</span><span class="kd">var</span> <span class="nx">t</span><span class="o">=++</span><span class="nx">N</span><span class="o">+</span><span class="s2">&quot;&quot;</span><span class="p">;</span><span class="k">return</span> <span class="nx">n</span><span class="o">?</span><span class="nx">n</span><span class="o">+</span><span class="nx">t</span><span class="o">:</span><span class="nx">t</span><span class="p">},</span><span class="nx">j</span><span class="p">.</span><span class="nx">templateSettings</span><span class="o">=</span><span class="p">{</span><span class="nx">evaluate</span><span class="o">:</span><span class="sr">/&lt;%([\s\S]+?)%&gt;/g</span><span class="p">,</span><span class="nx">interpolate</span><span class="o">:</span><span class="sr">/&lt;%=([\s\S]+?)%&gt;/g</span><span class="p">,</span><span class="nx">escape</span><span class="o">:</span><span class="sr">/&lt;%-([\s\S]+?)%&gt;/g</span><span class="p">};</span><span class="kd">var</span> <span class="nx">q</span><span class="o">=</span><span class="sr">/(.)^/</span><span class="p">,</span><span class="nx">B</span><span class="o">=</span><span class="p">{</span><span class="s2">&quot;&#39;&quot;</span><span class="o">:</span><span class="s2">&quot;&#39;&quot;</span><span class="p">,</span><span class="s2">&quot;\\&quot;</span><span class="o">:</span><span class="s2">&quot;\\&quot;</span><span class="p">,</span><span class="s2">&quot;\r&quot;</span><span class="o">:</span><span class="s2">&quot;r&quot;</span><span class="p">,</span><span class="s2">&quot;\n&quot;</span><span class="o">:</span><span class="s2">&quot;n&quot;</span><span class="p">,</span><span class="s2">&quot;	&quot;</span><span class="o">:</span><span class="s2">&quot;t&quot;</span><span class="p">,</span><span class="s2">&quot;\u2028&quot;</span><span class="o">:</span><span class="s2">&quot;u2028&quot;</span><span class="p">,</span><span class="s2">&quot;\u2029&quot;</span><span class="o">:</span><span class="s2">&quot;u2029&quot;</span><span class="p">},</span><span class="nx">D</span><span class="o">=</span><span class="sr">/\\|&#39;|\r|\n|\t|\u2028|\u2029/g</span><span class="p">;</span><span class="nx">j</span><span class="p">.</span><span class="nx">template</span><span class="o">=</span><span class="kd">function</span><span class="p">(</span><span class="nx">n</span><span class="p">,</span><span class="nx">t</span><span class="p">,</span><span class="nx">r</span><span class="p">){</span><span class="kd">var</span> <span class="nx">e</span><span class="p">;</span><span class="nx">r</span><span class="o">=</span><span class="nx">j</span><span class="p">.</span><span class="nx">defaults</span><span class="p">({},</span><span class="nx">r</span><span class="p">,</span><span class="nx">j</span><span class="p">.</span><span class="nx">templateSettings</span><span class="p">);</span><span class="kd">var</span> <span class="nx">u</span><span class="o">=</span><span class="k">new</span> <span class="nb">RegExp</span><span class="p">([(</span><span class="nx">r</span><span class="p">.</span><span class="nx">escape</span><span class="o">||</span><span class="nx">q</span><span class="p">).</span><span class="nx">source</span><span class="p">,(</span><span class="nx">r</span><span class="p">.</span><span class="nx">interpolate</span><span class="o">||</span><span class="nx">q</span><span class="p">).</span><span class="nx">source</span><span class="p">,(</span><span class="nx">r</span><span class="p">.</span><span class="nx">evaluate</span><span class="o">||</span><span class="nx">q</span><span class="p">).</span><span class="nx">source</span><span class="p">].</span><span class="nx">join</span><span class="p">(</span><span class="s2">&quot;|&quot;</span><span class="p">)</span><span class="o">+</span><span class="s2">&quot;|$&quot;</span><span class="p">,</span><span class="s2">&quot;g&quot;</span><span class="p">),</span><span class="nx">i</span><span class="o">=</span><span class="mi">0</span><span class="p">,</span><span class="nx">a</span><span class="o">=</span><span class="s2">&quot;__p+=&#39;&quot;</span><span class="p">;</span><span class="nx">n</span><span class="p">.</span><span class="nx">replace</span><span class="p">(</span><span class="nx">u</span><span class="p">,</span><span class="kd">function</span><span class="p">(</span><span class="nx">t</span><span class="p">,</span><span class="nx">r</span><span class="p">,</span><span class="nx">e</span><span class="p">,</span><span class="nx">u</span><span class="p">,</span><span class="nx">o</span><span class="p">){</span><span class="k">return</span> <span class="nx">a</span><span class="o">+=</span><span class="nx">n</span><span class="p">.</span><span class="nx">slice</span><span class="p">(</span><span class="nx">i</span><span class="p">,</span><span class="nx">o</span><span class="p">).</span><span class="nx">replace</span><span class="p">(</span><span class="nx">D</span><span class="p">,</span><span class="kd">function</span><span class="p">(</span><span class="nx">n</span><span class="p">){</span><span class="k">return</span><span class="s2">&quot;\\&quot;</span><span class="o">+</span><span class="nx">B</span><span class="p">[</span><span class="nx">n</span><span class="p">]}),</span><span class="nx">r</span><span class="o">&amp;&amp;</span><span class="p">(</span><span class="nx">a</span><span class="o">+=</span><span class="s2">&quot;&#39;+\n((__t=(&quot;</span><span class="o">+</span><span class="nx">r</span><span class="o">+</span><span class="s2">&quot;))==null?&#39;&#39;:_.escape(__t))+\n&#39;&quot;</span><span class="p">),</span><span class="nx">e</span><span class="o">&amp;&amp;</span><span class="p">(</span><span class="nx">a</span><span class="o">+=</span><span class="s2">&quot;&#39;+\n((__t=(&quot;</span><span class="o">+</span><span class="nx">e</span><span class="o">+</span><span class="s2">&quot;))==null?&#39;&#39;:__t)+\n&#39;&quot;</span><span class="p">),</span><span class="nx">u</span><span class="o">&amp;&amp;</span><span class="p">(</span><span class="nx">a</span><span class="o">+=</span><span class="s2">&quot;&#39;;\n&quot;</span><span class="o">+</span><span class="nx">u</span><span class="o">+</span><span class="s2">&quot;\n__p+=&#39;&quot;</span><span class="p">),</span><span class="nx">i</span><span class="o">=</span><span class="nx">o</span><span class="o">+</span><span class="nx">t</span><span class="p">.</span><span class="nx">length</span><span class="p">,</span><span class="nx">t</span><span class="p">}),</span><span class="nx">a</span><span class="o">+=</span><span class="s2">&quot;&#39;;\n&quot;</span><span class="p">,</span><span class="nx">r</span><span class="p">.</span><span class="nx">variable</span><span class="o">||</span><span class="p">(</span><span class="nx">a</span><span class="o">=</span><span class="s2">&quot;with(obj||{}){\n&quot;</span><span class="o">+</span><span class="nx">a</span><span class="o">+</span><span class="s2">&quot;}\n&quot;</span><span class="p">),</span><span class="nx">a</span><span class="o">=</span><span class="s2">&quot;var __t,__p=&#39;&#39;,__j=Array.prototype.join,&quot;</span><span class="o">+</span><span class="s2">&quot;print=function(){__p+=__j.call(arguments,&#39;&#39;);};\n&quot;</span><span class="o">+</span><span class="nx">a</span><span class="o">+</span><span class="s2">&quot;return __p;\n&quot;</span><span class="p">;</span><span class="k">try</span><span class="p">{</span><span class="nx">e</span><span class="o">=</span><span class="k">new</span> <span class="nb">Function</span><span class="p">(</span><span class="nx">r</span><span class="p">.</span><span class="nx">variable</span><span class="o">||</span><span class="s2">&quot;obj&quot;</span><span class="p">,</span><span class="s2">&quot;_&quot;</span><span class="p">,</span><span class="nx">a</span><span class="p">)}</span><span class="k">catch</span><span class="p">(</span><span class="nx">o</span><span class="p">){</span><span class="k">throw</span> <span class="nx">o</span><span class="p">.</span><span class="nx">source</span><span class="o">=</span><span class="nx">a</span><span class="p">,</span><span class="nx">o</span><span class="p">}</span><span class="k">if</span><span class="p">(</span><span class="nx">t</span><span class="p">)</span><span class="k">return</span> <span class="nx">e</span><span class="p">(</span><span class="nx">t</span><span class="p">,</span><span class="nx">j</span><span class="p">);</span><span class="kd">var</span> <span class="nx">c</span><span class="o">=</span><span class="kd">function</span><span class="p">(</span><span class="nx">n</span><span class="p">){</span><span class="k">return</span> <span class="nx">e</span><span class="p">.</span><span class="nx">call</span><span class="p">(</span><span class="k">this</span><span class="p">,</span><span class="nx">n</span><span class="p">,</span><span class="nx">j</span><span class="p">)};</span><span class="k">return</span> <span class="nx">c</span><span class="p">.</span><span class="nx">source</span><span class="o">=</span><span class="s2">&quot;function(&quot;</span><span class="o">+</span><span class="p">(</span><span class="nx">r</span><span class="p">.</span><span class="nx">variable</span><span class="o">||</span><span class="s2">&quot;obj&quot;</span><span class="p">)</span><span class="o">+</span><span class="s2">&quot;){\n&quot;</span><span class="o">+</span><span class="nx">a</span><span class="o">+</span><span class="s2">&quot;}&quot;</span><span class="p">,</span><span class="nx">c</span><span class="p">},</span><span class="nx">j</span><span class="p">.</span><span class="nx">chain</span><span class="o">=</span><span class="kd">function</span><span class="p">(</span><span class="nx">n</span><span class="p">){</span><span class="k">return</span> <span class="nx">j</span><span class="p">(</span><span class="nx">n</span><span class="p">).</span><span class="nx">chain</span><span class="p">()};</span><span class="kd">var</span> <span class="nx">z</span><span class="o">=</span><span class="kd">function</span><span class="p">(</span><span class="nx">n</span><span class="p">){</span><span class="k">return</span> <span class="k">this</span><span class="p">.</span><span class="nx">_chain</span><span class="o">?</span><span class="nx">j</span><span class="p">(</span><span class="nx">n</span><span class="p">).</span><span class="nx">chain</span><span class="p">()</span><span class="o">:</span><span class="nx">n</span><span class="p">};</span><span class="nx">j</span><span class="p">.</span><span class="nx">mixin</span><span class="p">(</span><span class="nx">j</span><span class="p">),</span><span class="nx">A</span><span class="p">([</span><span class="s2">&quot;pop&quot;</span><span class="p">,</span><span class="s2">&quot;push&quot;</span><span class="p">,</span><span class="s2">&quot;reverse&quot;</span><span class="p">,</span><span class="s2">&quot;shift&quot;</span><span class="p">,</span><span class="s2">&quot;sort&quot;</span><span class="p">,</span><span class="s2">&quot;splice&quot;</span><span class="p">,</span><span class="s2">&quot;unshift&quot;</span><span class="p">],</span><span class="kd">function</span><span class="p">(</span><span class="nx">n</span><span class="p">){</span><span class="kd">var</span> <span class="nx">t</span><span class="o">=</span><span class="nx">e</span><span class="p">[</span><span class="nx">n</span><span class="p">];</span><span class="nx">j</span><span class="p">.</span><span class="nx">prototype</span><span class="p">[</span><span class="nx">n</span><span class="p">]</span><span class="o">=</span><span class="kd">function</span><span class="p">(){</span><span class="kd">var</span> <span class="nx">r</span><span class="o">=</span><span class="k">this</span><span class="p">.</span><span class="nx">_wrapped</span><span class="p">;</span><span class="k">return</span> <span class="nx">t</span><span class="p">.</span><span class="nx">apply</span><span class="p">(</span><span class="nx">r</span><span class="p">,</span><span class="nx">arguments</span><span class="p">),</span><span class="s2">&quot;shift&quot;</span><span class="o">!=</span><span class="nx">n</span><span class="o">&amp;&amp;</span><span class="s2">&quot;splice&quot;</span><span class="o">!=</span><span class="nx">n</span><span class="o">||</span><span class="mi">0</span><span class="o">!==</span><span class="nx">r</span><span class="p">.</span><span class="nx">length</span><span class="o">||</span><span class="k">delete</span> <span class="nx">r</span><span class="p">[</span><span class="mi">0</span><span class="p">],</span><span class="nx">z</span><span class="p">.</span><span class="nx">call</span><span class="p">(</span><span class="k">this</span><span class="p">,</span><span class="nx">r</span><span class="p">)}}),</span><span class="nx">A</span><span class="p">([</span><span class="s2">&quot;concat&quot;</span><span class="p">,</span><span class="s2">&quot;join&quot;</span><span class="p">,</span><span class="s2">&quot;slice&quot;</span><span class="p">],</span><span class="kd">function</span><span class="p">(</span><span class="nx">n</span><span class="p">){</span><span class="kd">var</span> <span class="nx">t</span><span class="o">=</span><span class="nx">e</span><span class="p">[</span><span class="nx">n</span><span class="p">];</span><span class="nx">j</span><span class="p">.</span><span class="nx">prototype</span><span class="p">[</span><span class="nx">n</span><span class="p">]</span><span class="o">=</span><span class="kd">function</span><span class="p">(){</span><span class="k">return</span> <span class="nx">z</span><span class="p">.</span><span class="nx">call</span><span class="p">(</span><span class="k">this</span><span class="p">,</span><span class="nx">t</span><span class="p">.</span><span class="nx">apply</span><span class="p">(</span><span class="k">this</span><span class="p">.</span><span class="nx">_wrapped</span><span class="p">,</span><span class="nx">arguments</span><span class="p">))}}),</span><span class="nx">j</span><span class="p">.</span><span class="nx">extend</span><span class="p">(</span><span class="nx">j</span><span class="p">.</span><span class="nx">prototype</span><span class="p">,{</span><span class="nx">chain</span><span class="o">:</span><span class="kd">function</span><span class="p">(){</span><span class="k">return</span> <span class="k">this</span><span class="p">.</span><span class="nx">_chain</span><span class="o">=!</span><span class="mi">0</span><span class="p">,</span><span class="k">this</span><span class="p">},</span><span class="nx">value</span><span class="o">:</span><span class="kd">function</span><span class="p">(){</span><span class="k">return</span> <span class="k">this</span><span class="p">.</span><span class="nx">_wrapped</span><span class="p">}})}).</span><span class="nx">call</span><span class="p">(</span><span class="k">this</span><span class="p">);</span></div><div class='line' id='LC6'><span class="c1">//# sourceMappingURL=underscore-min.map</span></div></pre></div>
            </td>
          </tr>
        </table>
  </div>

  </div>
</div>

<a href="#jump-to-line" rel="facebox[.linejump]" data-hotkey="l" class="js-jump-to-line" style="display:none">Jump to Line</a>
<div id="jump-to-line" style="display:none">
  <form accept-charset="UTF-8" class="js-jump-to-line-form">
    <input class="linejump-input js-jump-to-line-field" type="text" placeholder="Jump to line&hellip;" autofocus>
    <button type="submit" class="button">Go</button>
  </form>
</div>

        </div>

      </div><!-- /.repo-container -->
      <div class="modal-backdrop"></div>
    </div><!-- /.container -->
  </div><!-- /.site -->


    </div><!-- /.wrapper -->

      <div class="container">
  <div class="site-footer">
    <ul class="site-footer-links right">
      <li><a href="https://status.github.com/">Status</a></li>
      <li><a href="http://developer.github.com">API</a></li>
      <li><a href="http://training.github.com">Training</a></li>
      <li><a href="http://shop.github.com">Shop</a></li>
      <li><a href="/blog">Blog</a></li>
      <li><a href="/about">About</a></li>

    </ul>

    <a href="/">
      <span class="mega-octicon octicon-mark-github"></span>
    </a>

    <ul class="site-footer-links">
      <li>&copy; 2013 <span title="0.04198s from github-fe132-cp1-prd.iad.github.net">GitHub</span>, Inc.</li>
        <li><a href="/site/terms">Terms</a></li>
        <li><a href="/site/privacy">Privacy</a></li>
        <li><a href="/security">Security</a></li>
        <li><a href="/contact">Contact</a></li>
    </ul>
  </div><!-- /.site-footer -->
</div><!-- /.container -->


    <div class="fullscreen-overlay js-fullscreen-overlay" id="fullscreen_overlay">
  <div class="fullscreen-container js-fullscreen-container">
    <div class="textarea-wrap">
      <textarea name="fullscreen-contents" id="fullscreen-contents" class="js-fullscreen-contents" placeholder="" data-suggester="fullscreen_suggester"></textarea>
          <div class="suggester-container">
              <div class="suggester fullscreen-suggester js-navigation-container" id="fullscreen_suggester"
                 data-url="/jashkenas/underscore/suggestions/commit">
              </div>
          </div>
    </div>
  </div>
  <div class="fullscreen-sidebar">
    <a href="#" class="exit-fullscreen js-exit-fullscreen tooltipped leftwards" title="Exit Zen Mode">
      <span class="mega-octicon octicon-screen-normal"></span>
    </a>
    <a href="#" class="theme-switcher js-theme-switcher tooltipped leftwards"
      title="Switch themes">
      <span class="octicon octicon-color-mode"></span>
    </a>
  </div>
</div>



    <div id="ajax-error-message" class="flash flash-error">
      <span class="octicon octicon-alert"></span>
      <a href="#" class="octicon octicon-remove-close close ajax-error-dismiss"></a>
      Something went wrong with that request. Please try again.
    </div>

  </body>
</html>

