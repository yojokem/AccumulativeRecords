jQuery(function () {
    $(".authenticate_btn").click(function (event) {
        var id = Number(event.target.attributes['target'].value);
        $.ajax({
                url: "/user/authenticate",
                method: "GET",
                cache: false,
                dataType: "json",
                data: {
                    user_id: id
                },
                success: function (data) {
                    $("#target_" + id).children()[9].innerText = data.authenticated;

                    if (data.authenticated == 1) {
                        $(event.target).removeClass("btn-primary");
                        $(event.target).addClass("btn-warning");
                        $(event.target).val("인증 해제");
                    } else if (data.authenticated == 0) {
                        $(event.target).removeClass("btn-warning");
                        $(event.target).addClass("btn-primary");
                        $(event.target).val("인증");
                    }
                },
                error: function (request, status, error) {
                    var msg = "ERROR : " + request.status + "\r\n"
                    msg += "내용 : " + request.responseText + "\r\n" + error;
                    console.log(msg);
                }
            })
            .done("Authentication has been updated for User #" + id)
            .fail((xhr, status, errorThrown) => console.log(xhr + "|" + status + "|" + errorThrown))
            .always((xhr, status) => console.log("Request has completed for authentication update of User #" + id));
    });

    setTimeout(function () {
        location.reload(true);
        console.log("Refresh!");
    }, 45000);
});