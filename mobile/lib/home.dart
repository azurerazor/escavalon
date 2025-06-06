import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:mobile/main.dart';
import 'package:url_launcher/url_launcher.dart';

import 'escavalon_material.dart';
import 'lobby.dart';
import 'login.dart';
import 'register.dart';
import 'history.dart';

class Home extends StatelessWidget {
  const Home({super.key});
  
  @override
  Widget build(BuildContext context) {
    return EscavalonPage(
      child: _HomeContent()
    );
  }
}

class _HomeContent extends StatefulWidget {
  const _HomeContent();

  @override
  State<_HomeContent> createState() => _HomeContentState();
}

class _HomeContentState extends State<_HomeContent> {
  String? _username;
  FlutterSecureStorage? webTokenStorage;

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: <Widget>[
        Builder(
          builder: (context) {
            if (_username != null) {
              return Text(
                "Welcome,\n $_username!",
                style: TextStyle(fontSize: 24),
                textAlign: TextAlign.center,
              );
            } else {
              return const Text(
                "Welcome to\n Escavalon!",
                style: TextStyle(fontSize: 24),
                textAlign: TextAlign.center,
              );
            }
          }
        ),

        SizedBox(height: 20,),

        EscavalonButton(
          text: 'New Game', 
          onPressed: () {
            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (context) => LobbyPage(token: webTokenStorage)
              )
            );
          }
        ),

        EscavalonButton(
          text: 'Open Web App', 
          onPressed: () {
            launchUrl(Uri.dataFromString(webAppURL));
          }
        ),

        Builder(
          builder: (context) {
            if (_username != null) { 
              return Column(
                children: <Widget>[
                  EscavalonButton(
                    text: 'History', 
                    onPressed: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (context) => HistoryPage(token: webTokenStorage!)
                        )
                      );                    }
                  ),
                  EscavalonButton(
                    text: 'Logout', 
                    onPressed: () {
                      showDialog(
                        context: context, 
                        builder: (context) => AlertDialog(
                          title: const Text("Logout"),
                          content: const Text("Are you sure you want to logout?"),
                          actions: <Widget>[
                            TextButton(
                              child: const Text("NO"),
                              onPressed: () {
                                Navigator.of(context).pop();
                              },
                            ),
                            TextButton(
                              child: const Text("YES"),
                              onPressed: () {
                                webTokenStorage?.delete(key: "token");
                                setState(() {
                                  _username = null;
                                });
                                
                                Navigator.of(context).pop();
                              },
                            ),
                          ],
                        )
                      );
                    }
                  ),
                ],
              );
            } else {
              return Column(
                children: <Widget>[
                  EscavalonButton(
                    text: 'Login', 
                    onPressed: () {                      
                      _getUserInfoFromLogin();
                    }
                  ),
                  EscavalonButton(
                    text: 'Register', 
                    onPressed: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (context) => EscavalonPage(child:RegisterPage())
                        )
                      );
                    }
                  ),
                ],
              );
            }
          }
        ),

      ],
    );
  }

  void _getUserInfoFromLogin() async {
    final info = await Navigator.push(
      context, 
      MaterialPageRoute(
        builder: (context) => LoginPage()
      )
    );

    if (info == null) return;

    setState(() {
      _username = info[0];
      webTokenStorage = info[1];
    });
  } 
}
