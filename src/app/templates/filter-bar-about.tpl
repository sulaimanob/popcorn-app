<ul class="nav nav-hor left">
	<li class="source showMovies"><%= i18n.__("Movies") %></li>
	<li class="source showShows"><%= i18n.__("TV Series") %></li>
</ul>

<ul class="nav nav-hor right">
	<li>
		<div class="right search">
			<form><input id="searchbox" type="text" placeholder="<%= i18n.__("Search") %>"></form>
		</div>
	</li>
	<li>
		<button class="favorites">
			<i class="fa fa-lg fa-heart"></i>
		</button>
	</li>
	<li>
		<button class="about active">
			<i class="fa fa-lg fa-info-circle"></i>
		</button>
		</li>
	<li>
		<button class="settings">
			<i class="fa fa-lg fa-cog"></i>
		</button>
	</li>
</ul>