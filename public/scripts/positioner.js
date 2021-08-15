jQuery(function () {
    $(".license_btn").click(function (event) {
        var id = Number(event.target.attributes['target'].value);
        $.ajax({
                url: "/user/position/license",
                method: "GET",
                cache: false,
                dataType: "json",
                data: {
                    position_id: id
                },
                success: function (data) {
                    if($("#license_target_" + id).length == 0) $("#target_" + id).children()[3].innerText = data.licensed;
                    else $("#license_target_" + id).children()[3].innerText = data.licensed;

                    if (data.licensed == 1) {
                        $(event.target).removeClass("btn-primary");
                        $(event.target).addClass("btn-warning");
                        $(event.target).val("허가 취소");
                    } else if (data.licensed == 0) {
                        $(event.target).removeClass("btn-warning");
                        $(event.target).addClass("btn-primary");
                        $(event.target).val("허가");
                    }
                },
                error: function (request, status, error) {
                    var msg = "ERROR : " + request.status + "\r\n"
                    msg += "내용 : " + request.responseText + "\r\n" + error;
                    console.log(msg);
                }
            })
            .done("License has been updated for Rank []" + + " of User #" + id)
            .fail((xhr, status, errorThrown) => console.log(xhr + "|" + status + "|" + errorThrown))
            .always((xhr, status) => console.log("Request has completed for license update of User #" + id));
    });

    var target;

    $("#prank").val("");
    $('input.addPosition').on('click', function (event) { // Or bind to any other event you like, or call manually
        var $t = $('#addPositionContainer');
        target = Number($(event.target).attr('target'));

        if ($t.is(':visible')) {
            $t.slideUp(400, function() {
                $("#prank").val("");
                delete $target;
            });
        } else {
            $t.slideDown(400, function() {
                $("#prank").val($("#target_" + target + " .prank").text());
            });
            $('html, body').animate({ scrollTop: $t.parent().offset().top }, 'slow');
            $("#order").focus();
        }
    });

    $("#closePosition").on('click', function (event) {
        var $t = $('#addPositionContainer');

        if ($t.is(':visible')) {
            $t.slideUp(400, function() {
                $("#prank").val("");
            });
        }
    });

    if(location.pathname != "/user/position/rank") {
        setTimeout(function () {
            location.reload(true);
            console.log("Refresh!");
        }, 45000);
    } else {
        setTimeout(function () {
            location.reload(true);
            console.log("Refresh!");
        }, 105000);
    }
});