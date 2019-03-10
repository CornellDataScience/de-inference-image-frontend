import asyncio
import websockets
import base64
from PIL import Image, ImageDraw
from io import BytesIO
from binascii import b2a_base64

lock = asyncio.Lock()
connection_num = 0

async def img_receiver(websocket, path):
    current_image_count = 0
    current_connection = None
    await lock.acquire()
    try:
        global connection_num
        current_connection = connection_num
        connection_num += 1
    finally:
        lock.release()
    
    try:
        while True:
            # read encoded image string
            image_str = await websocket.recv()
            # if empty, skip and wait again
            if not image_str or image_str == "null":
                continue

            # slice base64 string into data and metadata
            data_start_idx = image_str.index(",") 
            image_metadata = image_str[0:data_start_idx]
            image_data = image_str[data_start_idx+1:]

            print("(conn {}, img {}) reciv: {}".format(current_connection, current_image_count, image_metadata))

            # create pillow image
            image = Image.open(BytesIO(base64.b64decode(image_data)))

            # draw text to image
            d = ImageDraw.Draw(image)
            d.text((20,20), "connection#: {}, image#: {}".format(current_connection, current_image_count), fill=(255,255,0))

            # convert image to base64
            output_buffer = BytesIO()
            image.save(output_buffer, format="PNG")
            output_data_str = base64.b64encode(output_buffer.getvalue()).decode("ascii")
            
            # send modified image back to frontend
            output_data_url = "data:image/png;base64," + output_data_str
            await websocket.send(output_data_url)

            # increment image count
            current_image_count += 1
    except websockets.exceptions.ConnectionClosed:
        print("Connection closed by client")

start_server = websockets.serve(img_receiver, 'localhost', 8765, max_size=None)

asyncio.get_event_loop().run_until_complete(start_server)
asyncio.get_event_loop().run_forever()
