import asyncio
import websockets
import base64

async def img_receiver(websocket, path):
    image_str = await websocket.recv()
    data_start_idx = image_str.index(",")
    image_metadata = image_str[0:data_start_idx]
    image_data = image_str[data_start_idx+1:]

    print("metadata: {}".format(image_metadata))
    with open("received.png", "wb") as fh:
        fh.write(base64.decodebytes(bytearray(image_data, encoding="utf-16")))
        

start_server = websockets.serve(img_receiver, 'localhost', 8765, max_size=None)

asyncio.get_event_loop().run_until_complete(start_server)
asyncio.get_event_loop().run_forever()