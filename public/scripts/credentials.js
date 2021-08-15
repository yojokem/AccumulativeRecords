const mailFormat = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/,
  numberFormat = /^[0-9]{1}$/,
  number2Format = /^[0-9]{1,2}$/;

function login() {
  $("#password").val("");
  const username = $("#username").val();
  const password = pwEncrypt($("#passwordF").val());

  $("#modalMessage").html("")

  if (username.length > 20 || username.length < 1) {
    $("#modalMessage").html("<span class='__sText'>아이디는 1자 이상 20자 이하입니다.</span>");
    $('#warningMessage').modal({
      show: true
    });
    $("#passwordF").val("");
    $("#password").val("");
    return;
  }

  if ($("#passwordF").val().length < 1) {
    $("#modalMessage").html("<span class='__sText'>비밀번호를 입력하지 않으셨습니다.</span>");
    $('#warningMessage').modal({
      show: true
    });
    return;
  }

  $("#password").val(password);
  $("#loginForm")[0].submit();
}

function change() {
  $("#current").val("");
  $("#password").val("");
  const current = pwEncrypt($("#currentF").val());
  const password = pwEncrypt($("#passwordF").val());

  $("#modalMessage").html("")

  if ($("#currentF").val().length < 1) {
    $("#modalMessage").html("<span class='__sText'>현재 비밀번호를 입력하지 않으셨습니다.</span>");
    $('#warningMessage').modal({
      show: true
    });
    return;
  }

  if ($("#passwordF").val().length < 1) {
    $("#modalMessage").html("<span class='__sText'>변경 비밀번호를 입력하지 않으셨습니다.</span>");
    $('#warningMessage').modal({
      show: true
    });
    return;
  }

  $("#current").val(current);
  $("#password").val(password);
  $("#changeForm")[0].submit();
}

function register() {
  $("#modalMessage").html("");

  const username = $("#username").val();
  const password = pwEncrypt($("#password").val());
  const email = $("#email").val();
  const name = $("#name").val();
  const nickname = $("#nickname").val();
  const grade = $("#grade").val();
  const _class = $("#class").val();
  const number = $("#number").val();
  const position = $("#position").val();

  if (username.length > 20 || username.length < 1) {
    $("#modalMessage").html("<span class='__sText'>아이디는 1자 이상 20자 이하입니다.</span>");
    $('#warningMessage').modal({
      show: true
    });
    $("#password").val("");
    return;
  } else if ($("#password").val().length < 1) {
    $("#modalMessage").html("<span class='__sText'>비밀번호를 입력하지 않으셨습니다.</span>");
    $('#warningMessage').modal({
      show: true
    });
    return;
  } else if (email.length > 40 || email.length < 1 || !$("#email").val().match(mailFormat)) {
    $("#modalMessage").html("<span class='__sText'>이메일 주소가 올바르지 않습니다. (40자 이하)</span>");
    $('#warningMessage').modal({
      show: true
    });
    return;
  } else if (name.length > 5 || name.length < 1) {
    $("#modalMessage").html("<span class='__sText'>이름은 1자 이상 5자 이하입니다.</span>");
    $('#warningMessage').modal({
      show: true
    });
    return;
  } else if (nickname.length < 2 || nickname.length > 20) {
    $("#modalMessage").html("<span class='__sText'>닉네임은 5자 이상 20자 이하입니다.</span>");
    $('#warningMessage').modal({
      show: true
    });
    return;
  } else if (!numberFormat.test(grade)) {
    $("#modalMessage").html("<span class='__sText'>학년은 1학년, 2학년, 3학년입니다.</span>");
    $('#warningMessage').modal({
      show: true
    });
    return;
  } else if (!numberFormat.test(_class)) {
    $("#modalMessage").html("<span class='__sText'>반은 1~9반까지입니다.</span>");
    $('#warningMessage').modal({
      show: true
    });
    return;
  } else if (!number2Format.test(number)) {
    if (Number(number) <= 0 || Number(number) > 35) {
      $("#modalMessage").html("<span class='__sText'>번호는 1번부터 35번까지 입니다.</span>")
    } else $("#modalMessage").html("<span class='__sText'>번호는 한 자리 수부터 두 자리 수까지입니다. 1번부터 35번까지.</span>");
    $('#warningMessage').modal({
      show: true
    });

    return;
  } else if (position.length > 10) {
    $("#modalMessage").html("<span class='__sText'>직위는 10자 이내로 작성합니다.</span>");
    $('#warningMessage').modal({
      show: true
    });
    return;
  } else {
    checkIdenfiable(username, grade, _class, number, () => {
      $("#password").val(password);
      $("#registerForm")[0].submit();
    });
  }
}

function enterkey() {
  if (window.event.keyCode == 13) {
    login();
  }
}

function checkIdenfiable(username, grade, _class, number, callback) {
  $.ajax({
    url: "./uniqueUser",
    type: "GET",
    cache: false,
    dataType: "json",
    data: "value=" + username,
    success: function(data1) {
      if (data1.exist == true) {
        $("#password").val("");
        $("#modalMessage").html("<span class='__sText'>이미 존재하는 아이디입니다.</span>");
        $('#warningMessage').modal({
          show: true
        });
        return;
      } else {
        $.ajax({
          url: "./uniqueNumber",
          type: "GET",
          cache: false,
          dataType: "json",
          data: {
            grade: grade,
            class: _class,
            number: number
          },
          success: function(data2) {
            if (data2.exist == true) {
              $("#password").val("");
              $("#modalMessage").html("<span class='__sText'>이미 존재하는 학번입니다.</span>");
              $('#warningMessage').modal({
                show: true
              });
              return;
            } else callback();
          },
          error: function(request, status, error) {
            var msg = "ERROR : " + request.status + "\r\n"
            msg += "내용 : " + request.responseText + "\r\n" + error;
            console.log(msg);
          }
        });
      }
    },
    error: function(request, status, error) {
      var msg = "ERROR : " + request.status + "\r\n"
      msg += +"내용 : " + request.responseText + "\r\n" + error;
      console.log(msg);
    }
  });
}

function pwEncrypt(s) {
  return hex_sha512(s).toString().toLowerCase();
}
