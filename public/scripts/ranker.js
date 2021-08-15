jQuery(function () {
    $("#addRankSubmit").on('click', function (event) {
        const rank = $("input#rank").val().trim();
        const level = Number($("input#level").val().trim());

        $("#modalMessage").html("");

        if (rank.length < 1) {
            $("#modalMessage").html("<span class='__sText'>직위도 부적절합니다. (1자 이상)</span>");
            $('#warningMessage').modal({
                show: true
            });
            return;
        }

        if (isNaN(level)) {
            $("#modalMessage").html("<span class='__sText'>직위도의 등급을 작성하십시오. (숫자)</span>");
            $('#warningMessage').modal({
                show: true
            });
            return;
        }

        $.ajax({
            url: "./rank/uniqueRank",
            type: "GET",
            cache: false,
            dataType: "json",
            data: "value=" + rank,
            success: function (data1) {
                if (data1.exist == true) {
                    $("#modalMessage").html("<span class='__sText'>이미 존재하는 직위도입니다.</span>");
                    $('#warningMessage').modal({
                        show: true
                    });
                    return;
                } else {
                    $("#addRankForm")[0].submit();
                }
            },
            error: function (request, status, error) {
                var msg = "ERROR : " + request.status + "\r\n"
                msg += +"내용 : " + request.responseText + "\r\n" + error;
                console.log(msg);
            }
        });
    });

    $("input#username").on('change', function (event) {
        const $t = $(event.target).val();

        $.postCSRF('/user/findUser', {
            name: $t
        }).then(data => {
            $("#userGroupSelect").html("");
            for (var i in data) {
                const l = data[i];

                let id = l.id;
                let username = l.username;

                $("#userGroupSelect").append("<option value='" + id + "'>" + username + "</option>");
            }

            if (data.length > 0) {
                $("#userGroupSelect").val(data[0].id);
            }
        })
    });

    $("#userGroupSelect").on('change', function (event) {
        const $t = $(event.target).val();
        $("input#username").val($("#userGroupSelect option[value=" + $t + "]").text()).trigger('change');
    });

    $("#addPositionSubmit").on('click', function (event) {
        $("#modalMessage").html("");

        const rank = $("#prank").val();
        const order = $("#order").val();
        const user_id = Number($("#userGroupSelect").val());
        const licensed = $("#licensed").val() == "on" ? true : false;

        if (rank.length < 1) {
            $("#modalMessage").html("<span class='__sText'>직위도는 1글자 이상의 이름을 갖습니다.</span>");
            $('#warningMessage').modal({
                show: true
            });
            return;
        } else if (isNaN(order)) {
            $("#modalMessage").html("<span class='__sText'>등급은 숫자여야 합니다.</span>");
            $('#warningMessage').modal({
                show: true
            });
            return;
        } else if (isNaN(user_id)) {
            $("#modalMessage").html("<span class='__sText'>사용자 선택을 다시 한번 확인하여 주시기 바랍니다.</span>");
            $('#warningMessage').modal({
                show: true
            });
            return;
        }

        $.ajax({
            url: "/user/uniqueUser",
            type: "GET",
            cache: false,
            dataType: "json",
            data: "value=" + $("#userGroupSelect option[value=" + $("#userGroupSelect").val() + "]").text(),
            success: function (data1) {
                if (data1.exist == true) {
                    $.ajax({
                        url: "/user/position/row/" + $("#userGroupSelect option[value=" + $("#userGroupSelect").val() + "]").text(),
                        type: "GET",
                        cache: false,
                        dataType: "json",
                        success: function (data1) {
                            if (data1.length == 0) {
                                $("#addPositionForm").trigger('submit');
                            } else {
                                for (var i in data1) {
                                    let l = data1[i];

                                    if (l.rank == rank && l.order == order && l.user_id == user_id) {
                                        if (l.licensed != licensed && l.licensed == false) {
                                            $(".license_btn").filter(function (index) {
                                                return $($(".license_btn")[index]).attr('target') == l.id
                                            }).trigger('click');
                                        } else {
                                            $("#modalMessage").html("<span class='__sText'>이미 해당 직급이 등록되어 있습니다.</span>");
                                            $('#warningMessage').modal({
                                                show: true
                                            });
                                        }
                                    } else {
                                        $("#addPositionForm").submit();
                                    }
                                }
                            }
                        },
                        error: function (request, status, error) {
                            var msg = "ERROR : " + request.status + "\r\n"
                            msg += +"내용 : " + request.responseText + "\r\n" + error;
                            console.log(msg);
                        }
                    });
                } else {
                    $("#modalMessage").html("<span class='__sText'>해당 사용자는 존재하지 않습니다.</span>");
                    $('#warningMessage').modal({
                        show: true
                    });
                }
            },
            error: function (request, status, error) {
                var msg = "ERROR : " + request.status + "\r\n"
                msg += +"내용 : " + request.responseText + "\r\n" + error;
                console.log(msg);
            }
        });
    });

    setInterval(() => {
        let created = new Date();
        var currentTime = `
                  ${created.getFullYear().toString().padStart(4, '0')}-${
                  (created.getMonth()+1).toString().padStart(2, '0')}-${
                  created.getDate().toString().padStart(2, '0')}
                   
                  ${created.getHours().toString().padStart(2, '0')}:${
                  created.getMinutes().toString().padStart(2, '0')}:${
                  created.getSeconds().toString().padStart(2, '0')}`

        $("#currentTime").text(currentTime);
    }, 1000);

    $(".unuse_btn").on('click', function (event) {
        var id = Number(event.target.attributes['target'].value);

        $.ajax({
                url: "./rank/unuse",
                method: "GET",
                cache: false,
                dataType: "json",
                data: {
                    rank_id: id
                },
                success: function (data) {
                    $("#target_" + id).children()[3].innerText = data.unuse == 0 ? "false" : "true";

                    if (data.unuse == 1) {
                        $(event.target).removeClass("btn-warning");
                        $(event.target).addClass("btn-primary");
                        $(event.target).val("미사용 해제");
                    } else if (data.unuse == 0) {
                        $(event.target).removeClass("btn-primary");
                        $(event.target).addClass("btn-warning");
                        $(event.target).val("미사용");
                    }
                },
                error: function (request, status, error) {
                    var msg = "ERROR : " + request.status + "\r\n"
                    msg += "내용 : " + request.responseText + "\r\n" + error;
                    console.log(msg);
                }
            })
            .done("License has been updated for Rank []" + +" of User #" + id)
            .fail((xhr, status, errorThrown) => console.log(xhr + "|" + status + "|" + errorThrown))
            .always((xhr, status) => console.log("Request has completed for license update of User #" + id));
    });
});