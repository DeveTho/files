(function ($) {

	/* Get the querystring parameters
     http://stackoverflow.com/a/2880929

    Use:

    ?i=main&mode=front&sid=de8d49b78a85a322c4155015fdce22c4&enc=+Hello%20&empty

    urlParams = {
        enc: " Hello ",
        i: "main",
        mode: "front",
        sid: "de8d49b78a85a322c4155015fdce22c4",
        empty: ""
    }

    alert(urlParams["mode"]);
    // -> "front"

    alert("empty" in urlParams);
    // -> true */

    var urlParams;
	(window.onpopstate = function () {
		var match,
			pl = /\+/g,  // Regex for replacing addition symbol with a space
			search = /([^&=]+)=?([^&]*)/g,
			decode = function (s) { return decodeURIComponent(s.replace(pl, " ")); },
			query = window.location.search.substring(1);

		urlParams = {};
		while (match = search.exec(query))
			urlParams[decode(match[1])] = decode(match[2]);
	})();

	// Constants use in the code
	var constants = {
		numberOfFileTableColumns: 2
	};
	
	// Get the parent directory for a specific path
	function getParentDirectory(path) {

		var parentDirectoryArray = path.split('/');
		parentDirectoryArray.pop();
		var parentDirectory = parentDirectoryArray.join('/');

		if (parentDirectory === '') {
			parentDirectory = '/';
		}

		return parentDirectory;
	}

	// Get the name of the item in a specific path
	function getItemName(path) {

		var itemPathArray = path.split('/');
		return itemPathArray[itemPathArray.length - 1];
	}
	
	// Update the anchor tag that links to the current directory
	function updateCurrentDirectoryLink(path) {

		var currentDirectoryLink =
			window.location.origin + window.location.pathname + '?path=' + encodeURIComponent(path);

		$('#current-directory-link').attr('href', currentDirectoryLink);
	}
	
	// Update the body of the table with the items for the current directory
	function updateFileTableBody(files, parentDirectoryPath) {

		// Different function to return html dependent on the type of the item
		
		function getDefaultTypeRow(item) {

			return '<tr><td class="table-data-item-icon"><span class="glyphicon glyphicon-question-sign"></span></td>'
				+ '<td class="path-name">' + getItemName(item.path) + '</td></tr>';
		}

		function getDirectoryRow(directory) {

			return '<tr class="warning"><td class="table-data-item-icon"><span class="glyphicon glyphicon-folder-open"></span></td>'
				+ '<td class="path-name"><a href="#" data-item-type="' + directory.type + '" data-item-path="' + directory.path + '">'
				+ getItemName(directory.path) + '</a></td></tr>';
		}

		function getFileRow(file) {

			return '<tr class="info"><td class="table-data-item-icon"><span class="glyphicon glyphicon-file"></span></td>'
				+ '<td class="path-name"><a href="' + file.contentPath + '" target="_blank" data-item-type="' + file.type + '">'
				+ getItemName(file.path) + '</a></td></tr>';
		}

		var filesHtml = '';

		// If the current directory is not the root directory,
		// Add one item to go to the parent directory
		if (parentDirectoryPath !== false) {

			var $parentDirectoryRow = $(getDirectoryRow({
				'type': 'directory',
				'path': parentDirectoryPath
			}));

			$parentDirectoryRow.find('a').text('↑↑↑');

			filesHtml += $parentDirectoryRow[0].outerHTML;
		}

		// There are no items in the current directory
		if (files.length === 0) {

			filesHtml += '<tr><td class="text-center" colspan="' + constants.numberOfFileTableColumns + '">'
			+ '<strong>No content found in current directory</strong></td></tr>';

		} else {
			
			// Add the html for each item
			for (var i = 0; i < files.length; i++) {

				switch (files[i].type) {
					case 'directory':
						filesHtml += getDirectoryRow(files[i]);
						break;

					case 'file':
						filesHtml += getFileRow(files[i]);
						break;

					default:
						filesHtml += getDefaultTypeRow(files[i]);
						break;
				}
			}
		}

		$('#file-table tbody').html(filesHtml);
	}

	// Add functionality for the items after they are added to the table
	function addItemFunctionality(fileData) {

		$('#file-table tbody a[data-item-type]').click(function (event) {

			var $itemLink = $(this);

			switch ($itemLink.data('item-type')) {

				case 'directory':
					// Show the content for the directory when you click it
					event.preventDefault();
					loadFileTable($itemLink.data('item-path'), fileData);
					break;
			}
		});
	}

	// The main function to update the page with the current items
	function loadFileTable(path, fileData) {

		// Update the link on the top
		updateCurrentDirectoryLink(path);

		// Update the header with the currrent directory path
		$('#current-directory-header').text(path);

		// Get the items for the current directory from the whole fileData
		var currentDirectoryFiles = [];

		for (var i = 0; i < fileData.length; i++) {

			var parentDirectory = getParentDirectory(fileData[i].path);

			if (parentDirectory === path) {
				currentDirectoryFiles.push(fileData[i]);
			}
		}

		// Add the items to the table
		updateFileTableBody(currentDirectoryFiles, path === '/' ? false : getParentDirectory(path));
		
		// Add the functionality for the items just added to the table
		addItemFunctionality(fileData);
	}

	$(function () {
		
		// Get the JSON configuration file (no cache)
		$.ajax({
			method: 'GET',
			url: 'data/file-data.json',
			dataType: 'json',
			cache: false,
			success: function (fileData) {

				// Get the path from the url parameters when it's defined there
				var urlPath = urlParams['path'];

				if (urlPath === undefined || urlPath === null || urlPath === '') {
					urlPath = '/';
				}

				// Sort the file data
				// Directories should come before files the rest should come last
				fileData.sort(function (a, b) {

					function getFileItemSortString(fileItem) {

						var sortString = '';

						switch (fileItem.type) {
							case 'directory':
								sortString += '10';
								break;

							case 'file':
								sortString += '20';
								break;

							default:
								sortString += '99';
								break;
						}

						sortString += fileItem.path;

						return sortString;
					}

					return getFileItemSortString(a).localeCompare(getFileItemSortString(b));
				});

				// Execute the main function to load the data
				loadFileTable(urlPath, fileData);
			}
		});
	});

})(jQuery);