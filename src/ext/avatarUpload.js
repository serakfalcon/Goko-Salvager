/*jslint browser: true, devel: true, indent: 4, vars: true, nomen: true, regexp: true, forin: true */
/*global $, _, GS, FS, mtgRoom */

(function () {
    "use strict";

    var mod = GS.modules.avatarUpload = new GS.Module('Avatar Upload');
    mod.dependencies = [
        'Goko.Player.preloader',
        '#viewport',
        'mtgRoom.conn',
        '.fs-rs-logout-row',
        'FS.LaunchScreen.getInstance'
    ];
    mod.load = function () {

        console.log('Loading AU Module');

        // Create upload avatar dialog
        $('#viewport')
            .append($('<div>').attr('id', 'uploadAvatarDialog')
                              .attr('title', 'Upload Avatar')
                .append('Image will be resized/cropped to 100x100')
                .append($('<div>').attr('class', 'container')
                    .append($('<input>').attr('id', 'fileupload')
                                        .attr('type', 'file')
                                        .attr('name', 'files[]'))
                    .append($('<br>'))
                    .append($('<div>').attr('id', 'files')
                                      .attr('class', 'files'))));

        // Make upload avatar dialog into a JQueryUI popup
        $('#uploadAvatarDialog').dialog({
            modal: true,
            width: 450,
            height: 300,
            closeText: 'Save',
            draggable: false,
            resizeable: false,
            autoOpen: false
        });

        // Change this to the location of your server-side upload handler:
        var url = 'https://andrewiannaccone.com:8889/submit_avatar',
            uploadButton = $('<button/>')
                .addClass('btn btn-primary')
                .prop('disabled', true)
                .text('Processing...')
                .on('click', function () {
                    var $this = $(this),
                        data = $this.data();
                    $this
                        .off('click')
                        .text('Abort')
                        .on('click', function () {
                            $this.remove();
                            data.abort();
                        });
                    data.submit().always(function () {
                        $this.remove();
                    });
                });

        $('#fileupload').fileupload({
            url: url,
            dataType: 'json',
            autoUpload: false,
            acceptFileTypes: /(\.|\/)(gif|jpe?g|png)$/i,
            maxFileSize: 1000000, // 1 MB
            paramName: 'avatar',
            replaceFileInput: false,
            previewMaxWidth: 100,
            previewMaxHeight: 100,
            previewCrop: true,
            formData: [{
                name: 'playerid',
                value: mtgRoom.conn.connInfo.playerId
            }]

        }).on('fileuploadadd', function (e, data) {
            $('#files').empty();
            data.context = $('<div/>').appendTo('#files');
            $.each(data.files, function (index, file) {
                var node = $('<p/>')
                        .append($('<span/>').text(file.name));
                if (!index) {
                    node
                        .append('<br>')
                        .append(uploadButton.clone(true).data(data));
                }
                node.appendTo(data.context);
            });

        }).on('fileuploadprocessalways', function (e, data) {
            var index = data.index,
                file = data.files[index],
                node = $(data.context.children()[index]);
            if (file.preview) {
                node
                    .prepend('<br>')
                    .prepend(file.preview);
            }
            if (file.error) {
                node
                    .append('<br>')
                    .append($('<span class="text-danger"/>').text(file.error));
            }
            if (index + 1 === data.files.length) {
                data.context.find('button')
                    .text('Upload')
                    .prop('disabled', !!data.files.error);
            }

        }).on('fileuploadprogressall', function (e, data) {
            var progress = parseInt(data.loaded / data.total * 100, 10);
            $('#progress .progress-bar').css(
                'width',
                progress + '%'
            );

        }).on('fileuploaddone', function (e, data) {
            console.log('Successful upload');
            console.log('Server says: ' + data.result);
            $('#uploadAvatarDialog').dialog('close');
            FS.LaunchScreen.getInstance().loadPlayerAvatar(mtgRoom.conn);

        }).on('fileuploadfail', function (e, data) {
            $.each(data.files, function (index, file) {
                var error = $('<span class="text-danger"/>').text('File upload failed.');
                console.log(data);
                $(data.context.children()[index])
                    .append('<br>')
                    .append(error);
            });

        }).prop('disabled', !$.support.fileInput)
            .parent().addClass($.support.fileInput ? undefined : 'disabled');
    };
}());
